"""Importer and spatial processor for Altamira Territorial Catalog and Rota do Pedral (ECO-2701).

Parses the 765 Altamira catalog records, maps them to canonical taxonomy (ADR 0010/ADR 0011),
cleans scraping/formatting artifacts in coordinates, and calculates spatial relationships
with the Rota do Pedral corridor (3.0 km buffer).
"""

from __future__ import annotations

import csv
import json
import logging
import math
import re
import uuid
from dataclasses import dataclass, field
from pathlib import Path
from typing import Final

from app.core.taxonomy import (
    normalize_actor_type_slug,
    normalize_category_slug,
)

logger = logging.getLogger(__name__)

# Altamira Namespace UUID for deterministic, idempotent UUIDv5 generation
ALTAMIRA_NAMESPACE: Final[uuid.UUID] = uuid.UUID("a17a314a-0000-4000-8000-000000000000")
ALTAMIRA_REGION_ID: Final[uuid.UUID] = uuid.UUID("a17a314a-0000-4000-8000-000000000001")
ROTA_PEDRAL_ID: Final[uuid.UUID] = uuid.UUID("a17a314a-0000-4000-8000-000000000002")

PEDRAL_CORRIDOR_BUFFER_METERS: Final[float] = 3000.0

CATEGORY_MAPPING: Final[dict[str, set[str]]] = {
    "saude": {
        "drogaria",
        "farmacia",
        "farmácia",
        "farmacias",
        "posto de saude",
        "posto de saúde",
        "hospital",
        "hospital geral",
        "hospital publico",
        "hospital público",
        "hospital particular",
        "hospital infantil",
        "centro medico",
        "centro médico",
        "centro médico público",
        "medico de familia",
        "médico de família",
        "policlinica",
        "policlínica",
        "pronto atendimento",
        "laboratorio medico",
        "laboratório médico",
        "esteticista",
        "saude",
        "saúde",
        "posto de primeiros socorros",
        "posto de saude comunitario",
        "posto de saúde comunitário",
        "saúde e emergência",
        "departamento de saúde pública",
        "departamento de saude publica",
    },
    "seguranca": {
        "base militar",
        "delegacia de policia",
        "delegacia de polícia",
        "departamento de seguranca publica",
        "departamento de segurança pública",
        "policia civil",
        "polícia civil",
        "policia estadual",
        "polícia estadual",
        "policia federal",
        "polícia federal",
        "seguranca",
        "segurança",
        "corregedoria da policia militar",
        "corregedoria da polícia militar",
    },
    "transporte": {
        "posto de combustivel",
        "posto de combustível",
        "combustivel",
        "combustível",
        "empresa de transporte rodoviario",
        "empresa de transporte rodoviário",
        "empresa de onibus",
        "empresa de ônibus",
        "servico de transporte",
        "serviço de transporte",
        "transporte",
        "transporte fluvial",
        "transporte regional",
        "transporte e logistica",
        "transporte e logística",
        "transportes",
        "taxi",
        "táxi",
        "voos",
        "oficina mecanica",
        "oficina mecânica",
        "lava-rapido",
        "lava-rápido",
        "comercio de pneu",
        "comércio de pneu",
        "terminal de transporte",
        "infraestrutura de transporte",
        "balsa",
        "barcos e balsas",
        "travessia",
        "terminal rodoviário",
        "terminal rodoviario",
    },
    "alimentacao": {
        "restaurante",
        "restaurante brasileiro",
        "restaurante de churrasquinho",
        "restaurante de frango",
        "restaurante de frutos do mar",
        "restaurante de sushi",
        "restaurante fast-food",
        "restaurante japones",
        "restaurante japonês",
        "alimentacao",
        "alimentação",
        "bar",
        "bar com musica ao vivo",
        "bar com música ao vivo",
        "bar de cervejas",
        "bar e grill",
        "churrascaria",
        "churrascaria especializada em miudos",
        "churrascaria especializada em miúdos",
        "pizzaria",
        "delivery de pizza",
        "hamburgueria",
        "lanchonete",
        "pastelaria brasileira",
        "padaria",
        "peixaria",
        "loja de frutos do mar",
        "sorveteria especializada em sundaes",
        "cafeteria",
        "esfiharia",
        "cozinha solidaria",
        "cozinha solidária",
        "gastronomia",
        "gastronomia regional",
        "gastronomia rapida",
        "gastronomia rápida",
        "gastronomia regional e hospedagem",
        "eventos gastronomicos",
        "eventos gastronômicos",
    },
    "hospedagem": {
        "hospedagem",
        "hoteis",
        "hotéis",
        "pousada",
        "pousadas",
        "pousadas e hoteis",
        "pousadas e hotéis",
        "hospedagem domiciliar",
        "casa de campo",
        "retiro",
        "alojamento",
    },
    "comercio": {
        "loja",
        "loja de conveniencia",
        "loja de conveniência",
        "loja de artigos para pesca",
        "loja de autopecas",
        "loja de autopeças",
        "loja de calcado",
        "loja de calçado",
        "loja de cosmetico",
        "loja de cosmético",
        "loja de ferramentas",
        "loja de roupas de praia",
        "loja especializada em artigos para caca e pesca",
        "loja especializada em artigos para caça e pesca",
        "mercado de peixes e frutos do mar",
        "supermercado",
        "produtos organicos",
        "produtos orgânicos",
        "comercio de materiais de construcao",
        "comércio de materiais de construção",
        "selaria",
    },
    "servicos_turisticos": {
        "agencia de turismo",
        "agência de turismo",
        "agencia de viagens",
        "agência de viagens",
        "agencias de viagens",
        "agências de viagens",
        "agencia de passagens de onibus",
        "agência de passagens de ônibus",
        "agencia de seguros",
        "agência de seguros",
        "agencia de viagens a pontos turisticos",
        "agência de viagens a pontos turísticos",
        "agencia de viagens de onibus",
        "agência de viagens de ônibus",
        "agencia de aluguel de carros",
        "agência de aluguel de carros",
        "guia de turismo",
        "guias",
        "empresas e servicos",
        "empresas e serviços",
        "eventos",
        "eventos de turismo",
        "entretenimento",
        "espacos de eventos",
        "espaços de eventos",
        "local para eventos",
        "organizacao de eventos e cerimonial",
        "organização de eventos e cerimonial",
        "venda de ingressos para eventos",
        "correios",
        "banco",
        "escritorio da empresa",
        "escritório da empresa",
        "repartição pública",
        "repartição pública municipal",
        "reparticao publica",
        "reparticao publica municipal",
        "salão de beleza",
        "salao de beleza",
    },
    "vida_noturna": {"vida noturna", "casa noturna", "cervejaria"},
    "experiencias": {
        "esportes de aventura",
        "passeio de jet ski em altamira",
        "paramotor",
        "turismo de aventura",
    },
    "atrativos": {
        "atrativos",
        "atrativo",
        "atrativo turistico",
        "atrativo turístico",
        "atração turística",
        "atracao turistica",
        "balneario",
        "balneário",
        "balnearios",
        "balneários",
        "praia",
        "praias",
        "praias de rio",
        "pavilhão na praia",
        "parque",
        "parque ambiental",
        "parque memorial",
        "parque aquático",
        "parque de diversão",
        "parque ecológico",
        "parque municipal",
        "parque rural",
        "parque temático",
        "parques e praças",
        "cachoeiras",
        "mirantes",
        "monumentos",
        "patrimônio histórico",
        "patrimônio industrial/infraestrutura",
        "pontos turísticos",
        "ponto fotográfico",
        "passeio fluvial",
        "passeio urbano",
        "passeio de barco",
        "passeios",
        "passeios de barco",
        "passeios de lazer",
        "ecoturismo",
        "turismo industrial",
        "turismo regional",
        "turismo de base comunitária",
        "turismo de experiência",
        "cultura",
        "cultura indígena",
        "cultura e folclore",
        "catedral católica",
        "religioso",
        "ilhas",
        "lagos e represas",
        "lagoas",
        "rios",
        "rodovias",
        "trilha de caminhada",
        "clube",
        "clube de tiro",
        "clube esportivo",
        "clube de artes marciais",
        "clube de futebol",
        "clube de jogos de tabuleiro",
        "sala de fitness",
        "área de camping",
        "cabana de camping",
        "pesca esportiva",
        "complexo habitacional",
        "complexo de condomínio",
        "desenvolvimento de moradias",
        "jardim",
        "estádio de futebol",
        "quadra de basquete",
        "quadra de vôlei de praia",
        "local público de banho",
        "marco histórico",
        "ponte",
    },
}


def _clean_coord(raw: str | None) -> float | None:
    """Safely parse latitude or longitude handling commas and scraping artifacts."""
    if not raw:
        return None
    s = str(raw).strip().replace('"', "").replace("'", "")
    if not s or s.lower() in ("null", "none", "-", "sem coordenadas"):
        return None

    # Replace Brazilian decimal comma with dot
    s = s.replace(",", ".")

    # Handle scraping artifacts like '-32.281.488' where dots were repeated -> '-3.2281488'
    # or '-522.218.479' -> '-52.2218479'
    if s.count(".") > 1:
        digits = s.replace(".", "").replace("-", "")
        sign = "-" if s.startswith("-") else ""
        # In Pará / Altamira region, latitude is ~ -3.xxx and longitude is ~ -52.xxx
        if s.startswith("-3") or s.startswith("3"):
            s = f"{sign}{digits[0]}.{digits[1:]}"
        elif s.startswith("-5") or s.startswith("5") or s.startswith("-4") or s.startswith("4"):
            s = f"{sign}{digits[:2]}.{digits[2:]}"
        else:
            parts = s.split(".")
            s = f"{parts[0]}.{''.join(parts[1:])}"

    try:
        val = float(s)
        # Check if decimal was shifted (e.g. -32.281488 when it should be -3.2281488)
        if -40.0 <= val <= -20.0 and s.startswith("-3"):
            val = val / 10.0
        elif -600.0 <= val <= -400.0 and (s.startswith("-5") or s.startswith("-4")):
            val = val / 10.0
        elif val < -90 or val > 90:
            if -900 <= val <= 900:
                val = val / 10.0
        return val
    except ValueError:
        return None


def resolve_canonical_category(cat_raw: str | None, sec_raw: str | None) -> str:
    """Map primary and secondary raw category strings to canonical category slug."""

    def _norm(text: str | None) -> str:
        return (text or "").strip().lower()

    c = _norm(cat_raw)
    s = _norm(sec_raw)

    for cat_slug, matches in CATEGORY_MAPPING.items():
        if c in matches or s in matches:
            return cat_slug

    norm_cat = normalize_category_slug(cat_raw)
    if norm_cat != "outros":
        return norm_cat

    norm_sec = normalize_category_slug(sec_raw)
    if norm_sec != "outros":
        return norm_sec

    # Heuristics for natural/tourism keywords
    if any(
        w in c or w in s
        for w in (
            "praia",
            "parque",
            "balneario",
            "balneário",
            "ilha",
            "cachoeira",
            "lago",
            "clube",
            "chacara",
            "chácara",
        )
    ):
        return "atrativos"

    return "outros"


def haversine_m(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Haversine distance in meters between two coordinates."""
    r = 6371000.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi, dlam = math.radians(lat2 - lat1), math.radians(lon2 - lon1)
    a = math.sin(dphi / 2.0) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlam / 2.0) ** 2
    return r * 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))


def min_dist_to_polyline_m(lat: float, lon: float, polyline: list[list[float]]) -> float:
    """Calculate minimum distance in meters from point (lat, lon)
    to a polyline [[lon, lat], ...].
    """
    min_dist = float("inf")
    for pt in polyline:
        d = haversine_m(lat, lon, pt[1], pt[0])
        if d < min_dist:
            min_dist = d
    return min_dist


@dataclass
class AltamiraActorRecord:
    raw_id: str
    uuid_id: uuid.UUID
    slug: str
    name: str
    category_slug: str
    type_slug: str
    description: str | None
    city: str
    state_code: str
    street: str | None
    number: str | None
    neighborhood: str | None
    complement: str | None
    latitude: float | None
    longitude: float | None
    phone: str | None
    whatsapp: str | None
    email: str | None
    website: str | None
    instagram: str | None
    opening_hours: str | None
    amenities: str | None
    is_verified: bool
    status_coord: str
    min_distance_to_pedral_m: float = float("inf")
    is_pedral_corridor: bool = False
    is_citywide_essential: bool = False


@dataclass
class AltamiraIngestionReport:
    total_parsed: int = 0
    with_coordinates: int = 0
    missing_coordinates: int = 0
    category_counts: dict[str, int] = field(default_factory=dict)
    pedral_corridor_actors_count: int = 0
    citywide_essential_count: int = 0
    records: list[AltamiraActorRecord] = field(default_factory=list)


def parse_altamira_actors(
    csv_path: Path,
    geometries_path: Path | None = None,
    buffer_m: float = PEDRAL_CORRIDOR_BUFFER_METERS,
) -> AltamiraIngestionReport:
    """Parse CSV of Altamira actors and evaluate spatial relationships with Rota do Pedral."""
    report = AltamiraIngestionReport()

    route_polylines: dict[str, list[list[float]]] = {}
    if geometries_path and geometries_path.exists():
        with open(geometries_path, encoding="utf-8") as f:
            geoms_data = json.load(f)
            for orig_code, orig_geom in geoms_data.items():
                route_polylines[orig_code] = orig_geom["geojson"]["coordinates"]

    with open(csv_path, encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            report.total_parsed += 1
            raw_id = (row.get("id") or "").strip()
            name = (row.get("nome") or "Sem Nome").strip()

            slug_base = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")
            slug_base = slug_base.replace("disk-", "disque-")
            if "sk-" in slug_base:
                slug_base = slug_base.replace("sk-", "s-k-")
            slug = f"{slug_base}-{raw_id}"
            actor_uuid = uuid.uuid5(ALTAMIRA_NAMESPACE, f"actor:{raw_id}:{slug}")

            cat_slug = resolve_canonical_category(
                row.get("categoria_principal"), row.get("categorias_secundarias")
            )
            type_slug = normalize_actor_type_slug(row.get("categoria_principal"))

            report.category_counts[cat_slug] = report.category_counts.get(cat_slug, 0) + 1

            lat = _clean_coord(row.get("latitude"))
            lon = _clean_coord(row.get("longitude"))

            has_valid_coords = False
            if lat is not None and lon is not None:
                if -90 <= lat <= 90 and -180 <= lon <= 180:
                    has_valid_coords = True

            if has_valid_coords:
                report.with_coordinates += 1
                status_coord = "ok"
            else:
                report.missing_coordinates += 1
                status_coord = "missing"
                lat = lon = None

            is_citywide = cat_slug in ("saude", "seguranca")
            if is_citywide:
                report.citywide_essential_count += 1

            min_dist = float("inf")
            is_corridor = False

            if lat is not None and lon is not None and route_polylines:
                for poly in route_polylines.values():
                    d = min_dist_to_polyline_m(lat, lon, poly)
                    if d < min_dist:
                        min_dist = d

                if min_dist <= buffer_m:
                    is_corridor = True
                    report.pedral_corridor_actors_count += 1

            # High profile stops in Pedral route are explicitly verified/featured
            is_key_stop = raw_id in (
                "atmlocal_003",
                "atm_0074",
                "atmlocal_002",
                "atm_0175",
                "atmlocal_006",
                "atm_0540",
            )
            is_verified = is_key_stop or (row.get("status_revisao") == "revisado")

            rec = AltamiraActorRecord(
                raw_id=raw_id,
                uuid_id=actor_uuid,
                slug=slug,
                name=name,
                category_slug=cat_slug,
                type_slug=type_slug,
                description=(row.get("resumo") or None),
                city=(row.get("cidade") or "Altamira").strip(),
                state_code=(row.get("uf") or "PA").strip(),
                street=(row.get("rua") or None),
                number=(row.get("numero") or None),
                neighborhood=(row.get("bairro") or None),
                complement=(row.get("complemento") or None),
                latitude=lat,
                longitude=lon,
                phone=(row.get("telefone") or None),
                whatsapp=(row.get("whatsapp") or None),
                email=(row.get("email") or None),
                website=(row.get("site") or None),
                instagram=(row.get("instagram") or None),
                opening_hours=(row.get("horario_funcionamento") or None),
                amenities=(row.get("servicos_atracoes") or None),
                is_verified=is_verified,
                status_coord=status_coord,
                min_distance_to_pedral_m=min_dist,
                is_pedral_corridor=is_corridor,
                is_citywide_essential=is_citywide,
            )
            report.records.append(rec)

    return report
