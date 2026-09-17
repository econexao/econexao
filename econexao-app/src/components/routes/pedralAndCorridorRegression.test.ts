import type { MapPin, RouteDetail, RouteOrigin, RouteGeometry } from '../../api/types';
import {
  filterPinsByModeAndCategory,
  getFitCoordinates,
  getGeometryCoordinates,
  isCoordinateWithinBounds,
} from '../map/MapAdapter.helpers';

interface MockOrigin extends RouteOrigin {
  latitude: number;
  longitude: number;
}

interface MockRouteDetail extends Omit<RouteDetail, 'origins'> {
  origins: MockOrigin[];
  bounds?: {
    min_lat: number;
    max_lat: number;
    min_lng: number;
    max_lng: number;
  };
  city_bounds?: {
    min_lat: number;
    max_lat: number;
    min_lng: number;
    max_lng: number;
  };
}

describe('ECO-2700 Regression: Pedral 4 official origins and corridor boundaries', () => {
  // 4 Origens oficiais da Rota do Pedral (Balneário Luiz do Pedral) - Migration 20260917160415
  const PEDRAL_DESTINATION = {
    latitude: -3.255088,
    longitude: -52.2194072,
    name: 'Balneário Luiz do Pedral',
  };

  const PEDRAL_ORIGINS: MockOrigin[] = [
    {
      id: 'a17a314a-0000-4000-8000-000000000011',
      route_id: 'a17a314a-0000-4000-8000-000000000002',
      code: 'rodoviaria',
      name: 'Terminal Rodoviário de Altamira',
      sort_order: 1,
      latitude: -3.205732,
      longitude: -52.2198928,
      description: 'Terminal Rodoviário de Altamira (10,5 km até Balneário Luiz do Pedral)',
      distance_m: 10516,
      duration_s: 962,
    },
    {
      id: 'a17a314a-0000-4000-8000-000000000012',
      route_id: 'a17a314a-0000-4000-8000-000000000002',
      code: 'aeroporto',
      name: 'Aeroporto de Altamira',
      sort_order: 2,
      latitude: -3.2534371,
      longitude: -52.2480994,
      description: 'Aeroporto de Altamira (5,5 km até Balneário Luiz do Pedral)',
      distance_m: 5464,
      duration_s: 504,
    },
    {
      id: 'a17a314a-0000-4000-8000-000000000013',
      route_id: 'a17a314a-0000-4000-8000-000000000002',
      code: 'terminal_fluvial',
      name: 'Terminal Fluvial / Cais da Orla',
      sort_order: 3,
      latitude: -3.2058603,
      longitude: -52.2054132,
      description: 'Terminal Fluvial de Altamira (10,6 km até Balneário Luiz do Pedral)',
      distance_m: 10642,
      duration_s: 980,
    },
    {
      id: 'a17a314a-0000-4000-8000-000000000014',
      route_id: 'a17a314a-0000-4000-8000-000000000002',
      code: 'centro',
      name: 'Centro (Praça da Matriz)',
      sort_order: 4,
      latitude: -3.205289,
      longitude: -52.206082,
      description: 'Centro de Altamira (10,5 km até Balneário Luiz do Pedral)',
      distance_m: 10477,
      duration_s: 965,
    },
  ];

  const PEDRAL_ROUTE: MockRouteDetail = {
    id: 'a17a314a-0000-4000-8000-000000000002',
    slug: 'rota-pedral',
    title: 'Rota do Pedral (Altamira)',
    summary: 'Percurso ao longo do Rio Xingu até o Balneário Luiz do Pedral.',
    description: 'Acesso às margens e balneários de Altamira com 4 origens oficiais.',
    city: 'Altamira',
    state_code: 'PA',
    status: 'active',
    is_verified: true,
    best_season: 'Ano todo',
    bounds: {
      min_lat: -3.258951,
      max_lat: -3.205203,
      min_lng: -52.248099,
      max_lng: -52.205413,
    },
    city_bounds: {
      min_lat: -3.30,
      max_lat: -3.15,
      min_lng: -52.30,
      max_lng: -52.15,
    },
    origins: PEDRAL_ORIGINS,
    cover_image_url: null,
    cover_media: null,
    is_favorite: false,
  };

  it('valida que todas as 4 origens do Pedral estão presentes e possuem coordenadas válidas', () => {
    expect(PEDRAL_ROUTE.origins).toHaveLength(4);
    const codes = PEDRAL_ROUTE.origins.map((o) => o.code);
    expect(codes).toEqual(['rodoviaria', 'aeroporto', 'terminal_fluvial', 'centro']);

    for (const origin of PEDRAL_ROUTE.origins) {
      expect(origin.latitude).toBeLessThan(0); // Hemisfério Sul
      expect(origin.longitude).toBeLessThan(0); // Hemisfério Oeste
      expect(origin.distance_m).toBeGreaterThan(5000);
      expect(origin.distance_m).toBeLessThan(12000);
      expect(origin.duration_s).toBeGreaterThan(400);
      expect(origin.duration_s).toBeLessThan(1200);

      // Cada origem deve estar dentro dos bounds da rota do Pedral
      expect(
        isCoordinateWithinBounds(
          { latitude: origin.latitude, longitude: origin.longitude },
          PEDRAL_ROUTE.bounds!
        )
      ).toBe(true);
    }
  });

  it('valida que o destino Balneário Luiz do Pedral está dentro dos bounds da rota', () => {
    expect(
      isCoordinateWithinBounds(
        { latitude: PEDRAL_DESTINATION.latitude, longitude: PEDRAL_DESTINATION.longitude },
        PEDRAL_ROUTE.bounds!
      )
    ).toBe(true);
  });

  it('isola estritamente os pins do corredor do Pedral em relação a serviços municipais', () => {
    const pins: MapPin[] = [
      {
        id: 'pin-pedral-corridor-1',
        actor_id: 'actor-pedral-1',
        name: 'Restaurante Beira Rio Pedral',
        category_slug: 'alimentacao',
        category_label: 'Alimentação',
        color: '#D97706',
        icon: 'utensils',
        latitude: -3.22,
        longitude: -52.21,
        layer: 'route_corridor',
      },
      {
        id: 'pin-altamira-hospital',
        actor_id: 'actor-hospital-altamira',
        name: 'Hospital Regional Público da Transamazônica',
        category_slug: 'saude',
        category_label: 'Saúde',
        color: '#DC2626',
        icon: 'heart-pulse',
        latitude: -3.208,
        longitude: -52.215,
        layer: 'citywide_essential',
      },
      {
        id: 'pin-pedral-both',
        actor_id: 'actor-pedral-both',
        name: 'Posto de Combustível Acesso Pedral',
        category_slug: 'transporte',
        category_label: 'Transporte',
        color: '#0891B2',
        icon: 'bus',
        latitude: -3.23,
        longitude: -52.22,
        layer: 'both',
      },
    ];

    // Modo rota: apenas corredor e both
    const routeModePins = filterPinsByModeAndCategory(pins, 'route', '', null);
    expect(routeModePins.map((p) => p.id)).toEqual(['pin-pedral-corridor-1', 'pin-pedral-both']);

    // Modo cidade: inclui o hospital municipal citywide_essential
    const cityModePins = filterPinsByModeAndCategory(pins, 'city', '', null);
    expect(cityModePins.map((p) => p.id)).toEqual([
      'pin-pedral-corridor-1',
      'pin-altamira-hospital',
      'pin-pedral-both',
    ]);
  });

  it('converte geometrias da rota do Pedral para coordenadas de renderização sem mutação', () => {
    const pedralGeometry: RouteGeometry = {
      id: 'geom-pedral-rodoviaria',
      route_origin_id: 'a17a314a-0000-4000-8000-000000000011',
      provider: 'osrm',
      geojson: {
        type: 'LineString',
        coordinates: [
          [-52.219993, -3.205579],
          [-52.219825, -3.205469],
          [-52.2194072, -3.255088], // Destino
        ],
      },
      distance_m: 10516,
      duration_s: 962,
    };

    const coords = getGeometryCoordinates(pedralGeometry);
    expect(coords).toHaveLength(3);
    expect(coords[0]).toEqual({ latitude: -3.205579, longitude: -52.219993 });
    expect(coords[2]).toEqual({ latitude: -3.255088, longitude: -52.2194072 });

    const fitCoords = getFitCoordinates(PEDRAL_ROUTE.bounds, pedralGeometry, []);
    expect(fitCoords).toHaveLength(2);
    expect(fitCoords[0]).toEqual({ latitude: -3.258951, longitude: -52.248099 });
    expect(fitCoords[1]).toEqual({ latitude: -3.205203, longitude: -52.205413 });
  });
});
