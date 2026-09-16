"""Apply Altamira / Xingu region, Rota do Pedral and 765 actors catalog (ECO-2701)."""

from __future__ import annotations

import asyncio
import json
import logging
import sys
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

from app.core.config import Settings
from app.ingestion.altamira_importer import (
    ALTAMIRA_REGION_ID,
    PEDRAL_CORRIDOR_BUFFER_METERS,
    ROTA_PEDRAL_ID,
    min_dist_to_polyline_m,
    parse_altamira_actors,
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

BACKEND_DIR = Path(__file__).resolve().parents[1]
ROOT_DIR = BACKEND_DIR.parent
DATA_DIR = ROOT_DIR / "docs" / "data" / "altamira"


async def apply(dry_run: bool = False, db_url_override: str | None = None) -> int:
    env_file = BACKEND_DIR / ".env"
    load_dotenv(env_file, override=False)
    settings = Settings()

    csv_path = DATA_DIR / "atores_altamira.csv"
    geoms_path = DATA_DIR / "pedral_geometries.json"

    if not csv_path.exists():
        raise FileNotFoundError(f"Missing CSV: {csv_path}")
    if not geoms_path.exists():
        raise FileNotFoundError(f"Missing Geometries: {geoms_path}")

    logger.info("Parsing Altamira catalog...")
    report = parse_altamira_actors(csv_path, geoms_path, buffer_m=PEDRAL_CORRIDOR_BUFFER_METERS)
    logger.info(
        "Parsed %d actors (with coords: %d, missing coords: %d, "
        "in Pedral corridor: %d, citywide essential: %d)",
        report.total_parsed,
        report.with_coordinates,
        report.missing_coordinates,
        report.pedral_corridor_actors_count,
        report.citywide_essential_count,
    )

    if dry_run:
        summary = {
            "status": "dry_run_success",
            "region": "altamira-xingu",
            "route": "rota-pedral",
            "total_parsed": report.total_parsed,
            "with_coordinates": report.with_coordinates,
            "missing_coordinates": report.missing_coordinates,
            "corridor_actors_count": report.pedral_corridor_actors_count,
            "citywide_essential_count": report.citywide_essential_count,
            "categories": report.category_counts,
        }
        out_summary = DATA_DIR / "altamira_ingestion_summary.json"
        out_summary.write_text(json.dumps(summary, indent=2), encoding="utf-8")
        logger.info("Dry-run complete! Saved summary to %s", out_summary)
        return 0

    db_url = db_url_override or settings.DATABASE_URL.get_secret_value()
    engine = create_async_engine(db_url)

    with open(geoms_path, encoding="utf-8") as f:
        geoms_data = json.load(f)

    async with engine.begin() as conn:
        # 1. Apply base migration SQL for region, route, origins and geometries
        migration_sql_path = (
            ROOT_DIR / "supabase" / "migrations" / "20260916202210_altamira_xingu_pedral_base.sql"
        )
        if migration_sql_path.exists():
            logger.info("Applying base migration %s", migration_sql_path.name)
            raw_sql = migration_sql_path.read_text(encoding="utf-8")
            # Remove BEGIN/COMMIT if present to avoid nesting in engine.begin()
            clean_sql = "\n".join(
                line
                for line in raw_sql.splitlines()
                if not line.strip().upper().startswith("BEGIN")
                and not line.strip().upper().startswith("COMMIT")
            )
            await conn.execute(text(clean_sql))

        # 2. Fetch category IDs and type IDs
        cat_rows = (
            await conn.execute(text("SELECT slug, id FROM app_private.actor_categories"))
        ).fetchall()
        cat_map = {row[0]: row[1] for row in cat_rows}

        type_rows = (
            await conn.execute(text("SELECT slug, id FROM app_private.actor_types"))
        ).fetchall()
        type_map = {row[0]: row[1] for row in type_rows}
        default_type_id = type_map.get("nao_classificado")

        # 3. Upsert Actors
        logger.info("Upserting %d actors into app_private.actors...", len(report.records))
        actor_insert_stmt = text(
            """
            INSERT INTO app_private.actors (
                id,
                slug,
                name,
                description,
                category_id,
                type_id,
                region_id,
                address,
                city,
                state_code,
                phone,
                email,
                website,
                instagram,
                location,
                status,
                is_verified,
                created_at,
                updated_at
            )
            VALUES (
                :id,
                :slug,
                :name,
                :description,
                :category_id,
                :type_id,
                :region_id,
                :address,
                :city,
                :state_code,
                :phone,
                :email,
                :website,
                :instagram,
                CASE
                    WHEN :lat IS NOT NULL AND :lon IS NOT NULL
                    THEN extensions.ST_SetSRID(
                        extensions.ST_MakePoint(:lon, :lat), 4326
                    )::extensions.geography
                    ELSE NULL
                END,
                'active',
                :is_verified,
                clock_timestamp(),
                clock_timestamp()
            )
            ON CONFLICT (slug) DO UPDATE SET
                name = EXCLUDED.name,
                description = EXCLUDED.description,
                category_id = EXCLUDED.category_id,
                type_id = EXCLUDED.type_id,
                region_id = EXCLUDED.region_id,
                address = EXCLUDED.address,
                city = EXCLUDED.city,
                state_code = EXCLUDED.state_code,
                phone = EXCLUDED.phone,
                email = EXCLUDED.email,
                website = EXCLUDED.website,
                instagram = EXCLUDED.instagram,
                location = EXCLUDED.location,
                is_verified = EXCLUDED.is_verified,
                updated_at = clock_timestamp()
            """
        )

        for rec in report.records:
            cat_id = cat_map.get(rec.category_slug) or cat_map["outros"]
            type_id = type_map.get(rec.type_slug) or default_type_id
            addr_parts = [
                p for p in (rec.street, rec.number, rec.neighborhood, rec.complement) if p
            ]
            full_addr = ", ".join(addr_parts) if addr_parts else None

            await conn.execute(
                actor_insert_stmt,
                {
                    "id": rec.uuid_id,
                    "slug": rec.slug,
                    "name": rec.name,
                    "description": rec.description,
                    "category_id": cat_id,
                    "type_id": type_id,
                    "region_id": ALTAMIRA_REGION_ID,
                    "address": full_addr,
                    "city": rec.city,
                    "state_code": rec.state_code,
                    "phone": rec.phone,
                    "email": rec.email,
                    "website": rec.website,
                    "instagram": rec.instagram,
                    "lat": rec.latitude,
                    "lon": rec.longitude,
                    "is_verified": rec.is_verified,
                },
            )

        # 4. Upsert Route Actors for Rota do Pedral
        logger.info("Calculating and upserting route_actors for Rota do Pedral...")
        route_actor_stmt = text(
            """
            INSERT INTO app_private.route_actors (
                id,
                route_id,
                actor_id,
                distance_to_route_m,
                route_segment_index,
                origin_flags,
                created_at,
                updated_at
            )
            VALUES (
                gen_random_uuid(),
                :route_id,
                :actor_id,
                :dist_m,
                0,
                :flags::jsonb,
                clock_timestamp(),
                clock_timestamp()
            )
            ON CONFLICT (route_id, actor_id) DO UPDATE SET
                distance_to_route_m = EXCLUDED.distance_to_route_m,
                origin_flags = EXCLUDED.origin_flags,
                updated_at = clock_timestamp()
            """
        )

        linked_count = 0
        for rec in report.records:
            if (
                not rec.is_pedral_corridor
                or rec.latitude is None
                or rec.longitude is None
            ):
                continue

            # Per-origin distance flags
            flags = {}
            for orig_code, orig_geom in geoms_data.items():
                poly = orig_geom["geojson"]["coordinates"]
                d = min_dist_to_polyline_m(rec.latitude, rec.longitude, poly)
                flags[orig_code] = d <= PEDRAL_CORRIDOR_BUFFER_METERS

            await conn.execute(
                route_actor_stmt,
                {
                    "route_id": ROTA_PEDRAL_ID,
                    "actor_id": rec.uuid_id,
                    "dist_m": int(round(rec.min_distance_to_pedral_m)),
                    "flags": json.dumps(flags),
                },
            )
            linked_count += 1

    await engine.dispose()
    logger.info(
        "Successfully ingested Altamira catalog! Actors: %d, Corridor RouteActors: %d",
        len(report.records),
        linked_count,
    )
    return 0


if __name__ == "__main__":
    if sys.platform == "win32":
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    is_dry = "--dry-run" in sys.argv
    db_override = None
    if "--db-url" in sys.argv:
        idx = sys.argv.index("--db-url")
        if idx + 1 < len(sys.argv):
            db_override = sys.argv[idx + 1]
    raise SystemExit(asyncio.run(apply(dry_run=is_dry, db_url_override=db_override)))
