"""Apply Altamira Ambé Floresta Park route and corridor associations (ECO-2627)."""

from __future__ import annotations

import asyncio
import csv
import json
import logging
import sys
from pathlib import Path
from typing import Any

from dotenv import load_dotenv
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

from app.core.config import Settings
from app.ingestion.altamira_importer import (
    _clean_coord,
    min_dist_to_polyline_m,
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

BACKEND_DIR = Path(__file__).resolve().parents[1]
ROOT_DIR = BACKEND_DIR.parent
DATA_DIR = ROOT_DIR / "docs" / "data" / "altamira"
ROTA_AMBE_ID = "a17a314a-0000-4000-8000-000000000004"


def calculate_ambe_corridor(
    csv_path: Path, geoms_path: Path, buffer_m: float = 1000.0
) -> dict[str, Any]:
    with open(geoms_path, encoding="utf-8") as f:
        geoms_data = json.load(f)

    polylines = {
        code: geoms_data[code]["geojson"]["coordinates"]
        for code in ("rodoviaria", "aeroporto", "terminal_fluvial", "centro")
        if code in geoms_data
    }

    total_parsed = 0
    with_coordinates = 0
    missing_coordinates = 0
    corridor_actor_ids = set()
    origin_counts = {code: 0 for code in polylines}

    with open(csv_path, encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            total_parsed += 1
            lat = _clean_coord(row.get("latitude"))
            lon = _clean_coord(row.get("longitude"))

            if lat is not None and lon is not None and -90 <= lat <= 90 and -180 <= lon <= 180:
                with_coordinates += 1
                in_corridor = False
                for code, poly in polylines.items():
                    d = min_dist_to_polyline_m(lat, lon, poly)
                    if d <= buffer_m:
                        origin_counts[code] += 1
                        in_corridor = True
                if in_corridor:
                    corridor_actor_ids.add(row["id"])
            else:
                missing_coordinates += 1

    return {
        "status": "dry_run_success",
        "region": "altamira-xingu",
        "route": "rota-ambe",
        "route_id": ROTA_AMBE_ID,
        "total_parsed": total_parsed,
        "with_coordinates": with_coordinates,
        "missing_coordinates": missing_coordinates,
        "corridor_actors_count": len(corridor_actor_ids),
        "origin_counts": origin_counts,
    }


async def apply(dry_run: bool = False, db_url_override: str | None = None) -> int:
    env_file = BACKEND_DIR / ".env"
    load_dotenv(env_file, override=False)
    settings = Settings()

    csv_path = DATA_DIR / "atores_altamira.csv"
    geoms_path = DATA_DIR / "ambe_geometries.json"

    if not csv_path.exists():
        raise FileNotFoundError(f"Missing CSV: {csv_path}")
    if not geoms_path.exists():
        raise FileNotFoundError(f"Missing Geometries: {geoms_path}")

    logger.info("Computing Ambé corridor...")
    summary = calculate_ambe_corridor(csv_path, geoms_path)
    logger.info(
        "Ambé corridor: %d unique actors "
        "(rodoviaria: %d, aeroporto: %d, terminal_fluvial: %d, centro: %d)",
        summary["corridor_actors_count"],
        summary["origin_counts"]["rodoviaria"],
        summary["origin_counts"]["aeroporto"],
        summary["origin_counts"]["terminal_fluvial"],
        summary["origin_counts"]["centro"],
    )

    out_summary = DATA_DIR / "ambe_ingestion_summary.json"
    out_summary.write_text(json.dumps(summary, indent=2), encoding="utf-8")
    logger.info("Saved summary report to %s", out_summary)

    if dry_run:
        logger.info("Dry-run complete (0 database writes).")
        return 0

    db_url = db_url_override or settings.DATABASE_URL.get_secret_value()
    engine = create_async_engine(db_url)

    migration_sql_path = (
        ROOT_DIR / "supabase" / "migrations" / "20260918203000_ambe_four_origins_route.sql"
    )
    if not migration_sql_path.exists():
        raise FileNotFoundError(f"Missing Migration SQL: {migration_sql_path}")

    raw_sql = migration_sql_path.read_text(encoding="utf-8")
    clean_sql = "\n".join(
        line
        for line in raw_sql.splitlines()
        if not line.strip().upper().startswith("BEGIN")
        and not line.strip().upper().startswith("COMMIT")
    )

    async with engine.begin() as conn:
        logger.info("Applying migration %s...", migration_sql_path.name)
        await conn.execute(text(clean_sql))
        logger.info("Migration applied successfully!")

    return 0


def main() -> None:
    dry_run = "--dry-run" in sys.argv
    res = asyncio.run(apply(dry_run=dry_run))
    sys.exit(res)


if __name__ == "__main__":
    main()
