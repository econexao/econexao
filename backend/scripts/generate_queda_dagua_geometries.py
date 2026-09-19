import hashlib
import json
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT_FILE = ROOT / "docs" / "data" / "altamira" / "queda_dagua_geometries.json"

origins = {
    "rodoviaria": (-52.2198928, -3.2057320),
    "aeroporto": (-52.2480994, -3.2534371),
    "terminal_fluvial": (-52.2054132, -3.2058603),
    "centro": (-52.206082, -3.205289),
}
dest = (-52.39089850755947, -3.322080679135625)

result = {}

for name, (orig_lon, orig_lat) in origins.items():
    # 1. GeoJSON format
    url_geojson = (
        f"http://router.project-osrm.org/route/v1/driving/"
        f"{orig_lon},{orig_lat};{dest[0]},{dest[1]}"
        f"?overview=full&geometries=geojson"
    )
    req_geojson = urllib.request.Request(
        url_geojson, headers={"User-Agent": "ECOnexao-Ingestion/1.0"}
    )
    with urllib.request.urlopen(req_geojson, timeout=15) as resp:
        data_geojson = json.loads(resp.read().decode("utf-8"))
        route_geojson = data_geojson["routes"][0]

    # 2. Polyline format
    url_poly = (
        f"http://router.project-osrm.org/route/v1/driving/"
        f"{orig_lon},{orig_lat};{dest[0]},{dest[1]}"
        f"?overview=full&geometries=polyline"
    )
    req_poly = urllib.request.Request(
        url_poly, headers={"User-Agent": "ECOnexao-Ingestion/1.0"}
    )
    with urllib.request.urlopen(req_poly, timeout=15) as resp:
        data_poly = json.loads(resp.read().decode("utf-8"))
        encoded_polyline = data_poly["routes"][0]["geometry"]

    coords = route_geojson["geometry"]["coordinates"]
    lons = [c[0] for c in coords]
    lats = [c[1] for c in coords]
    bounds = {
        "min_lat": round(min(lats), 6),
        "max_lat": round(max(lats), 6),
        "min_lon": round(min(lons), 6),
        "max_lon": round(max(lons), 6),
    }

    raw_geojson_str = json.dumps(route_geojson["geometry"], sort_keys=True)
    geom_hash = hashlib.sha256(raw_geojson_str.encode("utf-8")).hexdigest()

    result[name] = {
        "distance_m": int(round(route_geojson["distance"])),
        "duration_s": int(round(route_geojson["duration"])),
        "geojson": route_geojson["geometry"],
        "encoded_polyline": encoded_polyline,
        "bounds": bounds,
        "sha256": geom_hash,
    }
    print(
        f"{name}: distance={result[name]['distance_m']}m, "
        f"duration={result[name]['duration_s']}s, points={len(coords)}"
    )

OUT_FILE.parent.mkdir(parents=True, exist_ok=True)
with open(OUT_FILE, "w", encoding="utf-8") as f:
    json.dump(result, f, indent=2)

print(f"Saved to {OUT_FILE}")
