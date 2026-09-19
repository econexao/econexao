"""Generate deterministic SQL seed for Altamira actors and Rota do Pedral corridor (ECO-2701)."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from app.ingestion.altamira_importer import (
    ALTAMIRA_REGION_ID,
    PEDRAL_CORRIDOR_BUFFER_METERS,
    ROTA_PEDRAL_ID,
    min_dist_to_polyline_m,
    parse_altamira_actors,
)

BACKEND_DIR = Path(__file__).resolve().parents[1]
ROOT_DIR = BACKEND_DIR.parent
DATA_DIR = ROOT_DIR / "docs" / "data" / "altamira"


def generate_sql() -> None:
    csv_path = DATA_DIR / "atores_altamira.csv"
    geom_path = DATA_DIR / "pedral_geometries.json"
    out_sql_path = DATA_DIR / "altamira_actors_seed.sql"

    report = parse_altamira_actors(csv_path, geom_path)
    with open(geom_path, encoding="utf-8") as f:
        geoms_data = json.load(f)

    lines: list[str] = [
        "-- Seed SQL: Altamira 765 Actors and Rota do Pedral Corridor (ECO-2701)",
        "-- Generated from verified CSV catalog and OSRM geometries.",
        "BEGIN;",
        "",
    ]

    def esc(s: Any) -> str:
        if s is None:
            return "NULL"
        clean = str(s).replace("'", "''")
        return f"'{clean}'"

    for rec in report.records:
        addr_parts = [p for p in (rec.street, rec.number, rec.neighborhood, rec.complement) if p]
        full_addr = ", ".join(addr_parts) if addr_parts else None

        if rec.latitude is not None and rec.longitude is not None:
            loc_val = (
                f"extensions.ST_SetSRID(extensions.ST_MakePoint({rec.longitude}, "
                f"{rec.latitude}), 4326)::extensions.geography"
            )
        else:
            loc_val = "NULL"

        type_subquery = (
            f"(SELECT id FROM app_private.actor_types WHERE slug = '{rec.type_slug}')"
            if rec.type_slug
            else "(SELECT id FROM app_private.actor_types WHERE slug = 'nao_classificado')"
        )

        actor_sql = f"""INSERT INTO app_private.actors (
    id, slug, name, description, category_id, type_id, region_id, address,
    city, state_code, phone, email, website, instagram, location,
    verification_status, created_at, updated_at
) VALUES (
    '{rec.uuid_id}', {esc(rec.slug)}, {esc(rec.name)}, {esc(rec.description)},
    (SELECT id FROM app_private.actor_categories WHERE slug = '{rec.category_slug}'),
    {type_subquery},
    '{ALTAMIRA_REGION_ID}', {esc(full_addr)}, {esc(rec.city)}, {esc(rec.state_code)},
    {esc(rec.phone)}, {esc(rec.email)}, {esc(rec.website)}, {esc(rec.instagram)},
    {loc_val}, '{"verified" if rec.is_verified else "unverified"}',
    clock_timestamp(), clock_timestamp()
) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name, description = EXCLUDED.description,
    category_id = EXCLUDED.category_id, type_id = EXCLUDED.type_id,
    address = EXCLUDED.address, phone = EXCLUDED.phone, email = EXCLUDED.email,
    website = EXCLUDED.website, instagram = EXCLUDED.instagram,
    location = EXCLUDED.location, verification_status = EXCLUDED.verification_status,
    updated_at = clock_timestamp();"""
        lines.append(actor_sql)

    lines.append("")
    lines.append("-- Route Actors for Rota do Pedral (<= 1km segment distance)")
    lines.append(
        "UPDATE app_private.route_actors SET archived_at = clock_timestamp(), "
        "updated_at = clock_timestamp() "
        f"WHERE route_id = '{ROTA_PEDRAL_ID}' AND archived_at IS NULL;"
    )
    for rec in report.records:
        if (
            not rec.is_pedral_corridor
            or rec.latitude is None
            or rec.longitude is None
        ):
            continue
        flags: dict[str, bool] = {}
        for orig_code, orig_geom in geoms_data.items():
            poly = orig_geom["geojson"]["coordinates"]
            d = min_dist_to_polyline_m(rec.latitude, rec.longitude, poly)
            flags[orig_code] = d <= PEDRAL_CORRIDOR_BUFFER_METERS
        flags_json = json.dumps(flags).replace("'", "''")
        dist_m = int(round(rec.min_distance_to_pedral_m))

        route_actor_sql = f"""INSERT INTO app_private.route_actors (
    id, route_id, actor_id, distance_to_route_m, route_segment_index,
    origin_flags, created_at, updated_at
) VALUES (
    gen_random_uuid(), '{ROTA_PEDRAL_ID}', '{rec.uuid_id}', {dist_m}, 0,
    '{flags_json}'::jsonb, clock_timestamp(), clock_timestamp()
) ON CONFLICT (route_id, actor_id) DO UPDATE SET
    distance_to_route_m = EXCLUDED.distance_to_route_m,
    origin_flags = EXCLUDED.origin_flags,
    archived_at = NULL,
    updated_at = clock_timestamp();"""
        lines.append(route_actor_sql)

    lines.append("")
    lines.append("COMMIT;")
    lines.append("")

    out_sql_path.write_text("\n".join(lines), encoding="utf-8")
    print(
        f"Wrote {len(lines)} SQL blocks to {out_sql_path} "
        f"(Size: {out_sql_path.stat().st_size} bytes)"
    )


if __name__ == "__main__":
    generate_sql()
