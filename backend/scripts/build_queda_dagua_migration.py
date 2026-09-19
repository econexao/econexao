import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
GEOMS_FILE = ROOT / "docs" / "data" / "altamira" / "queda_dagua_geometries.json"
OUT_SQL = ROOT / "supabase" / "migrations" / "20260919110000_queda_dagua_four_origins_route.sql"

with open(GEOMS_FILE, encoding="utf-8") as f:
    geoms = json.load(f)

summary_txt = (
    "Refúgio ecológico e de lazer em Altamira, o Balneário e Pousada Queda D'água "
    "oferece banho refrescante em águas naturais, estrutura de pousada, área de descanso "
    "e contato com a natureza exuberante da região amazônica."
)
season_txt = (
    "Aberto o ano todo para banho e hospedagem, com destaque para fins de semana "
    "e temporada de sol amazônica."
)
conn_txt = (
    "Sinal de celular oscilante no trajeto pela Transamazônica; conectividade Wi-Fi "
    "disponível na sede da pousada."
)
access_txt = (
    "Acesso a partir de Altamira pela Rodovia Transamazônica (BR-230) asfaltada sentido "
    "oeste, com trecho final em estrada vicinal de terra/piçarra com boa trafegabilidade."
)
payment_txt = (
    "Pix e dinheiro em espécie são amplamente aceitos; cartões de débito e crédito "
    "sujeitos à estabilidade do sinal local."
)

def sql_escape(s: str) -> str:
    return s.replace("'", "''")


sql_lines = [
    "-- Migration: 20260919110000_queda_dagua_four_origins_route.sql",
    "-- Description: Add official route Balneário e Pousada Queda D'água in Altamira "
    "with 4 OSRM origins.",
    "",
    "BEGIN;",
    "",
    "-- 1. Insert or update Rota Balneário e Pousada Queda D'água",
    "INSERT INTO app_private.routes (",
    "    id,",
    "    region_id,",
    "    slug,",
    "    title,",
    "    summary,",
    "    city,",
    "    state_code,",
    "    status,",
    "    is_verified,",
    "    best_season,",
    "    connectivity,",
    "    road_access,",
    "    payment_info,",
    "    created_at,",
    "    updated_at",
    ") VALUES (",
    "    'a17a314a-0000-4000-8000-000000000005',",
    "    'a17a314a-0000-4000-8000-000000000001',",
    "    'rota-queda-dagua',",
    "    'Balneário e Pousada Queda D''água',",
    f"    '{sql_escape(summary_txt)}',",
    "    'Altamira',",
    "    'PA',",
    "    'active',",
    "    false,",
    f"    '{sql_escape(season_txt)}',",
    f"    '{sql_escape(conn_txt)}',",
    f"    '{sql_escape(access_txt)}',",
    f"    '{sql_escape(payment_txt)}',",
    "    clock_timestamp(),",
    "    clock_timestamp()",
    ") ON CONFLICT (slug) DO UPDATE SET",
    "    title = EXCLUDED.title,",
    "    summary = EXCLUDED.summary,",
    "    city = EXCLUDED.city,",
    "    state_code = EXCLUDED.state_code,",
    "    status = EXCLUDED.status,",
    "    is_verified = EXCLUDED.is_verified,",
    "    best_season = EXCLUDED.best_season,",
    "    connectivity = EXCLUDED.connectivity,",
    "    road_access = EXCLUDED.road_access,",
    "    payment_info = EXCLUDED.payment_info,",
    "    updated_at = clock_timestamp();",
    "",
    "-- 2. Insert 4 Official Origins for Balneário e Pousada Queda D'água",
    "INSERT INTO app_private.route_origins (",
    "    id,",
    "    route_id,",
    "    code,",
    "    name,",
    "    location,",
    "    sort_order,",
    "    created_at,",
    "    updated_at",
    ") VALUES",
    "    (",
    "        'a17a314a-0000-4000-8000-000000000041',",
    "        'a17a314a-0000-4000-8000-000000000005',",
    "        'rodoviaria',",
    "        'Terminal Rodoviário de Altamira',",
    (
        "        extensions.ST_SetSRID(extensions.ST_MakePoint("
        "-52.2198928, -3.2057320), 4326)::extensions.geography,"
    ),
    "        1,",
    "        clock_timestamp(),",
    "        clock_timestamp()",
    "    ),",
    "    (",
    "        'a17a314a-0000-4000-8000-000000000042',",
    "        'a17a314a-0000-4000-8000-000000000005',",
    "        'aeroporto',",
    "        'Aeroporto de Altamira',",
    (
        "        extensions.ST_SetSRID(extensions.ST_MakePoint("
        "-52.2480994, -3.2534371), 4326)::extensions.geography,"
    ),
    "        2,",
    "        clock_timestamp(),",
    "        clock_timestamp()",
    "    ),",
    "    (",
    "        'a17a314a-0000-4000-8000-000000000043',",
    "        'a17a314a-0000-4000-8000-000000000005',",
    "        'terminal_fluvial',",
    "        'Terminal Fluvial (Cais da Orla)',",
    (
        "        extensions.ST_SetSRID(extensions.ST_MakePoint("
        "-52.2054132, -3.2058603), 4326)::extensions.geography,"
    ),
    "        3,",
    "        clock_timestamp(),",
    "        clock_timestamp()",
    "    ),",
    "    (",
    "        'a17a314a-0000-4000-8000-000000000044',",
    "        'a17a314a-0000-4000-8000-000000000005',",
    "        'centro',",
    "        'Centro (Praça da Matriz)',",
    (
        "        extensions.ST_SetSRID(extensions.ST_MakePoint("
        "-52.206082, -3.205289), 4326)::extensions.geography,"
    ),
    "        4,",
    "        clock_timestamp(),",
    "        clock_timestamp()",
    "    )",
    "ON CONFLICT (route_id, code) DO UPDATE SET",
    "    name = EXCLUDED.name,",
    "    location = EXCLUDED.location,",
    "    sort_order = EXCLUDED.sort_order,",
    "    updated_at = clock_timestamp();",
    "",
]

origin_uuids = {
    "rodoviaria": "a17a314a-0000-4000-8000-000000000041",
    "aeroporto": "a17a314a-0000-4000-8000-000000000042",
    "terminal_fluvial": "a17a314a-0000-4000-8000-000000000043",
    "centro": "a17a314a-0000-4000-8000-000000000044",
}

sql_lines.append("-- 3. Insert Route Geometries for the 4 Origins")
for code, ouuid in origin_uuids.items():
    g = geoms[code]
    geojson_str = json.dumps(g["geojson"])
    bounds_str = json.dumps(g["bounds"])
    sql_lines.extend([
        "INSERT INTO app_private.route_geometries (",
        "    route_origin_id,",
        "    provider,",
        "    geometry,",
        "    encoded_polyline,",
        "    distance_m,",
        "    duration_s,",
        "    bounds,",
        "    source_hash,",
        "    created_at,",
        "    updated_at",
        ") VALUES (",
        f"    '{ouuid}',",
        "    'osrm',",
        (
            f"    extensions.ST_SetSRID("
            f"extensions.ST_GeomFromGeoJSON('{geojson_str}'), 4326)"
            f"::extensions.geography,"
        ),
        f"    '{g['encoded_polyline']}',",
        f"    {g['distance_m']},",
        f"    {g['duration_s']},",
        f"    '{bounds_str}'::jsonb,",
        f"    '{g['sha256']}',",
        "    clock_timestamp(),",
        "    clock_timestamp()",
        ") ON CONFLICT (route_origin_id, provider) DO UPDATE SET",
        "    geometry = EXCLUDED.geometry,",
        "    encoded_polyline = EXCLUDED.encoded_polyline,",
        "    distance_m = EXCLUDED.distance_m,",
        "    duration_s = EXCLUDED.duration_s,",
        "    bounds = EXCLUDED.bounds,",
        "    source_hash = EXCLUDED.source_hash,",
        "    updated_at = clock_timestamp();",
        "",
    ])

sql_lines.extend([
    "-- 4. Recalculate route_actors corridor distance and origin_flags for 1km buffer",
    "WITH corridor_calc AS (",
    "    SELECT",
    "        a.id AS actor_id,",
    "        MIN(extensions.ST_Distance(a.location, rg.geometry))::integer AS min_dist,",
    "        jsonb_build_object(",
    "            'rodoviaria', bool_or(",
    "                ro.code = 'rodoviaria' AND "
    "extensions.ST_DWithin(a.location, rg.geometry, 1000.0)",
    "            ),",
    "            'aeroporto', bool_or(",
    "                ro.code = 'aeroporto' AND "
    "extensions.ST_DWithin(a.location, rg.geometry, 1000.0)",
    "            ),",
    "            'terminal_fluvial', bool_or(",
    "                ro.code = 'terminal_fluvial' AND "
    "extensions.ST_DWithin(a.location, rg.geometry, 1000.0)",
    "            ),",
    "            'centro', bool_or(",
    "                ro.code = 'centro' AND "
    "extensions.ST_DWithin(a.location, rg.geometry, 1000.0)",
    "            )",
    "        ) AS flags",
    "    FROM app_private.actors a",
    "    CROSS JOIN app_private.route_origins ro",
    "    JOIN app_private.route_geometries rg ON rg.route_origin_id = ro.id",
    "    WHERE ro.route_id = 'a17a314a-0000-4000-8000-000000000005'",
    "      AND a.region_id = 'a17a314a-0000-4000-8000-000000000001'",
    "      AND a.location IS NOT NULL",
    "      AND a.deleted_at IS NULL",
    "    GROUP BY a.id",
    "    HAVING bool_or(extensions.ST_DWithin(a.location, rg.geometry, 1000.0)) = true",
    ")",
    "INSERT INTO app_private.route_actors (",
    "    id,",
    "    route_id,",
    "    actor_id,",
    "    distance_to_route_m,",
    "    route_segment_index,",
    "    origin_flags,",
    "    created_at,",
    "    updated_at",
    ")",
    "SELECT",
    "    gen_random_uuid(),",
    "    'a17a314a-0000-4000-8000-000000000005',",
    "    c.actor_id,",
    "    c.min_dist,",
    "    0,",
    "    c.flags,",
    "    clock_timestamp(),",
    "    clock_timestamp()",
    "FROM corridor_calc c",
    "ON CONFLICT (route_id, actor_id) DO UPDATE SET",
    "    distance_to_route_m = EXCLUDED.distance_to_route_m,",
    "    origin_flags = EXCLUDED.origin_flags,",
    "    archived_at = NULL,",
    "    updated_at = clock_timestamp();",
    "",
    "-- Remove route associations that are no longer within 1000m of any of the four geometries",
    "DELETE FROM app_private.route_actors ra",
    "WHERE ra.route_id = 'a17a314a-0000-4000-8000-000000000005'",
    "  AND NOT EXISTS (",
    "      SELECT 1",
    "      FROM app_private.actors a",
    "      CROSS JOIN app_private.route_origins ro",
    "      JOIN app_private.route_geometries rg ON rg.route_origin_id = ro.id",
    "      WHERE a.id = ra.actor_id",
    "        AND ro.route_id = 'a17a314a-0000-4000-8000-000000000005'",
    "        AND extensions.ST_DWithin(a.location, rg.geometry, 1000.0)",
    "  );",
    "",
    "COMMIT;",
    "",
])

OUT_SQL.write_text("\n".join(sql_lines), encoding="utf-8")
print(f"Generated migration: {OUT_SQL}")
