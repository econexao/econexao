"""Unit tests for Altamira Territorial Importer and Spatial Corridor (ECO-2701)."""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from app.core.taxonomy import CANONICAL_CATEGORIES
from app.ingestion.altamira_importer import (
    PEDRAL_CORRIDOR_BUFFER_METERS,
    PEDRAL_ORIGIN_CODES,
    _clean_coord,
    haversine_m,
    min_dist_to_polyline_m,
    parse_altamira_actors,
    resolve_canonical_category,
)

DATA_DIR = Path(__file__).resolve().parents[2] / "docs" / "data" / "altamira"


def test_min_dist_to_polyline_uses_segments() -> None:
    # The point lies on the middle of a long segment and is far from vertices.
    assert min_dist_to_polyline_m(0.0, 0.005, [[0.0, 0.0], [0.01, 0.0]]) < 1.0


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
    # Corridor count within 1km of route segments (not vertices).
    assert report.pedral_corridor_actors_count == 384
    # Citywide essential services count
    assert report.citywide_essential_count >= 110

    # Ensure every category is a valid canonical category
    for cat_slug in report.category_counts.keys():
        assert cat_slug in CANONICAL_CATEGORIES


def test_pedral_geometries_integrity():
    """Verify the four configured origins have valid geometry metadata ending at Pedral."""
    geoms_path = DATA_DIR / "pedral_geometries.json"
    with open(geoms_path, encoding="utf-8") as f:
        geoms = json.load(f)

    expected_origins = {"rodoviaria", "aeroporto", "terminal_fluvial", "centro"}
    assert expected_origins.issubset(
        geoms.keys()
    ), f"Missing origins: {expected_origins - set(geoms.keys())}"
    assert (
        set(PEDRAL_ORIGIN_CODES) == expected_origins
    ), f"PEDRAL_ORIGIN_CODES must have 4 origins, got {PEDRAL_ORIGIN_CODES}"

    pedral_dest_lat = -3.255088
    pedral_dest_lon = -52.2194072

    for code in expected_origins:
        g = geoms[code]
        assert g["distance_m"] > 0
        assert g["duration_s"] > 0
        coords = g["geojson"]["coordinates"]
        assert len(coords) > 50
        assert "bounds" in g
        b = g["bounds"]
        assert b["min_lat"] <= b["max_lat"]
        assert b["min_lon"] <= b["max_lon"]
        assert g["encoded_polyline"] is not None
        assert len(g["sha256"]) == 64

        # Verify continuity: no adjacent points further than 1500m apart
        for (lon1, lat1), (lon2, lat2) in zip(coords, coords[1:], strict=False):
            step_d = haversine_m(lat1, lon1, lat2, lon2)
            assert step_d < 1500.0, f"Discontinuity in {code}: {step_d:.1f}m between points"

        # All four origins must arrive at Balneário Luiz do Pedral (within 100m)
        end_lon, end_lat = coords[-1]
        dist_to_dest = haversine_m(end_lat, end_lon, pedral_dest_lat, pedral_dest_lon)
        msg = f"{code} ends at ({end_lat}, {end_lon}), {dist_to_dest:.1f}m from destination"
        assert dist_to_dest < 100.0, msg


def test_massanori_geometries_integrity():
    """Verify origins have valid geometry metadata ending at Praia do Massanori."""
    geoms_path = DATA_DIR / "massanori_geometries.json"
    assert geoms_path.exists(), "massanori_geometries.json must exist"

    with open(geoms_path, encoding="utf-8") as f:
        geoms = json.load(f)

    expected_origins = {"rodoviaria", "aeroporto", "terminal_fluvial", "centro"}
    assert expected_origins.issubset(
        geoms.keys()
    ), f"Missing origins: {expected_origins - set(geoms.keys())}"

    massanori_dest_lat = -3.208801
    massanori_dest_lon = -52.140232

    for code in expected_origins:
        g = geoms[code]
        assert g["distance_m"] > 0
        assert g["duration_s"] > 0
        coords = g["geojson"]["coordinates"]
        assert len(coords) > 50
        assert "bounds" in g
        b = g["bounds"]
        assert b["min_lat"] <= b["max_lat"]
        assert b["min_lon"] <= b["max_lon"]
        assert g["encoded_polyline"] is not None
        assert len(g["sha256"]) == 64

        # Verify continuity: no adjacent points further than 1500m apart
        for (lon1, lat1), (lon2, lat2) in zip(coords, coords[1:], strict=False):
            step_d = haversine_m(lat1, lon1, lat2, lon2)
            assert step_d < 1500.0, f"Discontinuity in {code}: {step_d:.1f}m between points"

        # Arrive at Praia do Massanori access area (within 200m of beach center)
        end_lon, end_lat = coords[-1]
        dist_to_dest = haversine_m(end_lat, end_lon, massanori_dest_lat, massanori_dest_lon)
        msg = f"{code} ends at ({end_lat}, {end_lon}), {dist_to_dest:.1f}m from destination"
        assert dist_to_dest < 200.0, msg


def test_massanori_corridor_counts():
    """Verify corridor calculation for Massanori route returns 435 unique actors."""
    from scripts.apply_altamira_massanori import calculate_massanori_corridor

    csv_path = DATA_DIR / "atores_altamira.csv"
    geoms_path = DATA_DIR / "massanori_geometries.json"

    res = calculate_massanori_corridor(csv_path, geoms_path, buffer_m=1000.0)
    assert res["status"] == "dry_run_success"
    assert res["total_parsed"] == 765
    assert res["with_coordinates"] == 571
    assert res["missing_coordinates"] == 194
    assert res["corridor_actors_count"] == 435
    assert res["origin_counts"]["rodoviaria"] == 280
    assert res["origin_counts"]["aeroporto"] == 145
    assert res["origin_counts"]["terminal_fluvial"] == 168
    assert res["origin_counts"]["centro"] == 173


def test_ambe_geometries_integrity():
    """Verify origins have valid geometry metadata ending at Ambé Floresta Park."""
    geoms_path = DATA_DIR / "ambe_geometries.json"
    assert geoms_path.exists(), "ambe_geometries.json must exist"

    with open(geoms_path, encoding="utf-8") as f:
        geoms = json.load(f)

    expected_origins = {"rodoviaria", "aeroporto", "terminal_fluvial", "centro"}
    assert expected_origins.issubset(
        geoms.keys()
    ), f"Missing origins: {expected_origins - set(geoms.keys())}"

    ambe_dest_lat = -3.125289
    ambe_dest_lon = -52.220835

    for code in expected_origins:
        g = geoms[code]
        assert g["distance_m"] > 0
        assert g["duration_s"] > 0
        coords = g["geojson"]["coordinates"]
        assert len(coords) > 50
        assert "bounds" in g
        b = g["bounds"]
        assert b["min_lat"] <= b["max_lat"]
        assert b["min_lon"] <= b["max_lon"]
        assert g["encoded_polyline"] is not None
        assert len(g["sha256"]) == 64

        # Verify continuity: no adjacent points further than 1500m apart
        for (lon1, lat1), (lon2, lat2) in zip(coords, coords[1:], strict=False):
            step_d = haversine_m(lat1, lon1, lat2, lon2)
            assert step_d < 1500.0, f"Discontinuity in {code}: {step_d:.1f}m between points"

        # Arrive at Ambé Floresta Park access area (within 100m of park entrance)
        end_lon, end_lat = coords[-1]
        dist_to_dest = haversine_m(end_lat, end_lon, ambe_dest_lat, ambe_dest_lon)
        msg = f"{code} ends at ({end_lat}, {end_lon}), {dist_to_dest:.1f}m from destination"
        assert dist_to_dest < 100.0, msg


def test_ambe_corridor_counts():
    """Verify corridor calculation for Ambé route returns 436 unique actors."""
    from scripts.apply_altamira_ambe import calculate_ambe_corridor

    csv_path = DATA_DIR / "atores_altamira.csv"
    geoms_path = DATA_DIR / "ambe_geometries.json"

    res = calculate_ambe_corridor(csv_path, geoms_path, buffer_m=1000.0)
    assert res["status"] == "dry_run_success"
    assert res["total_parsed"] == 765
    assert res["with_coordinates"] == 571
    assert res["missing_coordinates"] == 194
    assert res["corridor_actors_count"] == 436
    assert res["origin_counts"]["rodoviaria"] == 281
    assert res["origin_counts"]["aeroporto"] == 146
    assert res["origin_counts"]["terminal_fluvial"] == 169
    assert res["origin_counts"]["centro"] == 174


def test_queda_dagua_geometries_integrity():
    """Verify origins have valid geometry metadata for Balneário e Pousada Queda D'água."""
    geoms_path = DATA_DIR / "queda_dagua_geometries.json"
    assert geoms_path.exists(), "queda_dagua_geometries.json must exist"

    with open(geoms_path, encoding="utf-8") as f:
        geoms = json.load(f)

    expected_origins = {"rodoviaria", "aeroporto", "terminal_fluvial", "centro"}
    assert expected_origins.issubset(
        geoms.keys()
    ), f"Missing origins: {expected_origins - set(geoms.keys())}"

    # Snapped endpoint on BR-230 / vicinal junction
    snapped_dest_lat = -3.280970
    snapped_dest_lon = -52.385373

    for code in expected_origins:
        g = geoms[code]
        assert g["distance_m"] > 0
        assert g["duration_s"] > 0
        coords = g["geojson"]["coordinates"]
        assert len(coords) > 50
        assert "bounds" in g
        b = g["bounds"]
        assert b["min_lat"] <= b["max_lat"]
        assert b["min_lon"] <= b["max_lon"]
        assert g["encoded_polyline"] is not None
        assert len(g["sha256"]) == 64

        # Verify continuity: no adjacent points further than 1500m apart
        for (lon1, lat1), (lon2, lat2) in zip(coords, coords[1:], strict=False):
            step_d = haversine_m(lat1, lon1, lat2, lon2)
            assert step_d < 1500.0, f"Discontinuity in {code}: {step_d:.1f}m between points"

        # Arrive at common snapped endpoint (within 10m)
        end_lon, end_lat = coords[-1]
        dist_to_dest = haversine_m(end_lat, end_lon, snapped_dest_lat, snapped_dest_lon)
        msg = f"{code} ends at ({end_lat}, {end_lon}), {dist_to_dest:.1f}m from destination"
        assert dist_to_dest < 10.0, msg


def test_queda_dagua_corridor_counts():
    """Verify corridor calculation for Queda D'água route returns 398 unique actors."""
    from scripts.apply_altamira_queda_dagua import calculate_queda_dagua_corridor

    csv_path = DATA_DIR / "atores_altamira.csv"
    geoms_path = DATA_DIR / "queda_dagua_geometries.json"

    res = calculate_queda_dagua_corridor(csv_path, geoms_path, buffer_m=1000.0)
    assert res["status"] == "dry_run_success"
    assert res["total_parsed"] == 765
    assert res["with_coordinates"] == 571
    assert res["missing_coordinates"] == 194
    assert res["corridor_actors_count"] == 398
    assert res["origin_counts"]["rodoviaria"] == 250
    assert res["origin_counts"]["aeroporto"] == 74
    assert res["origin_counts"]["terminal_fluvial"] == 357
    assert res["origin_counts"]["centro"] == 356


def test_raizes_xingu_geometries_integrity():
    """Verify origins have valid geometry metadata for Sítio Raízes do Xingu."""
    geoms_path = DATA_DIR / "raizes_xingu_geometries.json"
    assert geoms_path.exists(), "raizes_xingu_geometries.json must exist"

    with open(geoms_path, encoding="utf-8") as f:
        geoms = json.load(f)

    expected_origins = {"rodoviaria", "aeroporto", "terminal_fluvial", "centro"}
    assert expected_origins.issubset(
        geoms.keys()
    ), f"Missing origins: {expected_origins - set(geoms.keys())}"

    # Snapped endpoint on BR-230 / Planaltina junction
    snapped_dest_lat = -3.353302
    snapped_dest_lon = -52.561737

    for code in expected_origins:
        g = geoms[code]
        assert g["distance_m"] > 0
        assert g["duration_s"] > 0
        coords = g["geojson"]["coordinates"]
        assert len(coords) > 50
        assert "bounds" in g
        b = g["bounds"]
        assert b["min_lat"] <= b["max_lat"]
        assert b["min_lon"] <= b["max_lon"]
        assert g["encoded_polyline"] is not None
        assert len(g["sha256"]) == 64

        # Verify continuity: no adjacent points further than 1500m apart
        for (lon1, lat1), (lon2, lat2) in zip(coords, coords[1:], strict=False):
            step_d = haversine_m(lat1, lon1, lat2, lon2)
            assert step_d < 1500.0, f"Discontinuity in {code}: {step_d:.1f}m between points"

        # Arrive at common snapped endpoint (within 10m)
        end_lon, end_lat = coords[-1]
        dist_to_dest = haversine_m(end_lat, end_lon, snapped_dest_lat, snapped_dest_lon)
        msg = f"{code} ends at ({end_lat}, {end_lon}), {dist_to_dest:.1f}m from destination"
        assert dist_to_dest < 10.0, msg


def test_raizes_xingu_corridor_counts():
    """Verify corridor calculation for Raízes do Xingu route returns 398 unique actors."""
    from scripts.apply_altamira_raizes_xingu import calculate_raizes_xingu_corridor

    csv_path = DATA_DIR / "atores_altamira.csv"
    geoms_path = DATA_DIR / "raizes_xingu_geometries.json"

    res = calculate_raizes_xingu_corridor(csv_path, geoms_path, buffer_m=1000.0)
    assert res["status"] == "dry_run_success"
    assert res["total_parsed"] == 765
    assert res["with_coordinates"] == 571
    assert res["missing_coordinates"] == 194
    assert res["corridor_actors_count"] == 398
    assert res["origin_counts"]["rodoviaria"] == 250
    assert res["origin_counts"]["aeroporto"] == 74
    assert res["origin_counts"]["terminal_fluvial"] == 357
    assert res["origin_counts"]["centro"] == 356
