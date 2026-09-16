"""Unit tests for Altamira Territorial Importer and Spatial Corridor (ECO-2701)."""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from app.core.taxonomy import CANONICAL_CATEGORIES
from app.ingestion.altamira_importer import (
    PEDRAL_CORRIDOR_BUFFER_METERS,
    _clean_coord,
    parse_altamira_actors,
    resolve_canonical_category,
)

DATA_DIR = Path(__file__).resolve().parents[2] / "docs" / "data" / "altamira"


def test_clean_coord_handles_commas_and_dots():
    """Verify Brazilian comma decimals and repeated dots are normalized."""
    assert _clean_coord("-3,2101465") == pytest.approx(-3.2101465)
    assert _clean_coord("-52,2093272") == pytest.approx(-52.2093272)
    # Scraping repeated dot artifact
    assert _clean_coord("-32.281.488") == pytest.approx(-3.2281488)
    # None/empty
    assert _clean_coord(None) is None
    assert _clean_coord("") is None
    assert _clean_coord("sem coordenadas") is None


def test_resolve_canonical_category_mappings():
    """Verify raw Altamira categories map to canonical categories."""
    assert resolve_canonical_category("Drogaria", "farmacias") == "saude"
    assert resolve_canonical_category("Hospital", "saude") == "saude"
    assert resolve_canonical_category("Delegacia de polícia", "seguranca") == "seguranca"
    assert resolve_canonical_category("Base militar", "seguranca") == "seguranca"
    assert resolve_canonical_category("Balneários", None) == "atrativos"
    assert resolve_canonical_category("Praia", "atrativos") == "atrativos"
    assert resolve_canonical_category("Restaurante", "alimentacao") == "alimentacao"
    assert resolve_canonical_category("Churrascaria", "alimentacao") == "alimentacao"
    assert resolve_canonical_category("Hotel", "hospedagem") == "hospedagem"
    assert resolve_canonical_category("Posto de combustível", "combustivel") == "transporte"


def test_parse_altamira_actors_counts_and_metrics():
    """Verify ingestion of the 765 actors from the official CSV."""
    csv_path = DATA_DIR / "atores_altamira.csv"
    geoms_path = DATA_DIR / "pedral_geometries.json"

    assert csv_path.exists(), "atores_altamira.csv must exist"
    assert geoms_path.exists(), "pedral_geometries.json must exist"

    report = parse_altamira_actors(csv_path, geoms_path, buffer_m=PEDRAL_CORRIDOR_BUFFER_METERS)

    assert report.total_parsed == 765
    assert report.with_coordinates == 571
    assert report.missing_coordinates == 194
    # Corridor count within 3km of the 4 routes
    assert report.pedral_corridor_actors_count >= 450
    # Citywide essential services count
    assert report.citywide_essential_count >= 110

    # Ensure every category is a valid canonical category
    for cat_slug in report.category_counts.keys():
        assert cat_slug in CANONICAL_CATEGORIES


def test_pedral_geometries_integrity():
    """Verify all 4 origins have valid geometries, bounds, and distance/duration."""
    geoms_path = DATA_DIR / "pedral_geometries.json"
    with open(geoms_path, encoding="utf-8") as f:
        geoms = json.load(f)

    expected_origins = {"rodoviaria", "aeroporto", "terminal_fluvial", "centro"}
    assert set(geoms.keys()) == expected_origins

    for code in expected_origins:
        g = geoms[code]
        assert g["distance_m"] > 0
        assert g["duration_s"] > 0
        assert len(g["geojson"]["coordinates"]) > 100
        assert "bounds" in g
        b = g["bounds"]
        assert b["min_lat"] <= b["max_lat"]
        assert b["min_lon"] <= b["max_lon"]
        assert g["encoded_polyline"] is not None
        assert len(g["sha256"]) == 64
