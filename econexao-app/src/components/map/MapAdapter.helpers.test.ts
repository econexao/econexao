import type { MapPin, RouteGeometry } from '../../api/types';
import {
  SELECTION_PIN_COLOR,
  filterPinsByDensity,
  filterPinsByModeAndCategory,
  formatCoordinateDisplay,
  getBoundsCoordinates,
  getFitCoordinates,
  getGeometryCoordinates,
  getInitialRegion,
  getItemAccessibilityLabel,
  getItemCategoryLabel,
  getItemCoordinate,
  getItemPinColor,
  getItemPinIcon,
  getSelectionPinAccessibilityLabel,
  getUserLocationAccessibilityLabel,
  isCoordinateWithinBounds,
  isContractPinColor,
  isContractPinIcon,
} from './MapAdapter.helpers';

const pin: MapPin = {
  id: '11111111-1111-4111-8111-111111111111',
  actor_id: '22222222-2222-4222-8222-222222222222',
  name: 'Ponto Pindobal',
  category_slug: 'hospedagem',
  category_label: 'Hospedagem',
  color: '#2563EB',
  icon: 'bed',
  latitude: -2.63,
  longitude: -54.94,
  layer: 'route_corridor',
};

const geometry: RouteGeometry = {
  id: '33333333-3333-4333-8333-333333333333',
  route_origin_id: '44444444-4444-4444-8444-444444444444',
  provider: 'osrm',
  geojson: {
    type: 'LineString',
    coordinates: [
      [-54.95, -2.64],
      [-54.9, -2.6],
    ],
  },
};

describe('MapAdapter shared geospatial helpers', () => {
  it('converts API pins and GeoJSON [longitude, latitude] safely', () => {
    expect(getItemCoordinate(pin)).toEqual({ latitude: -2.63, longitude: -54.94 });
    expect(getGeometryCoordinates(geometry)).toEqual([
      { latitude: -2.64, longitude: -54.95 },
      { latitude: -2.6, longitude: -54.9 },
    ]);
  });

  it('rejects invalid coordinates rather than placing them at a fake position', () => {
    expect(getItemCoordinate({ ...pin, latitude: 100 })).toBeNull();
    expect(
      getGeometryCoordinates({
        ...geometry,
        geojson: { type: 'LineString', coordinates: [[-54.95, 95]] },
      })
    ).toEqual([]);
  });

  it('uses API bounds as the authoritative fit target', () => {
    const bounds = { min_lat: -2.7, max_lat: -2.5, min_lng: -55, max_lng: -54.8 };
    expect(getBoundsCoordinates(bounds)).toEqual([
      { latitude: -2.7, longitude: -55 },
      { latitude: -2.5, longitude: -54.8 },
    ]);
    expect(getFitCoordinates(bounds, geometry, [pin])).toEqual(getBoundsCoordinates(bounds));
  });

  it('não reconstrói enquadramento local quando bounds autoritativo está ausente', () => {
    expect(getFitCoordinates(null, geometry, [pin])).toEqual([]);
    expect(getFitCoordinates(null, null, [pin])).toEqual([]);
  });

  it('derives a padded initial region from fit coordinates', () => {
    const region = getInitialRegion([
      { latitude: -2.7, longitude: -55 },
      { latitude: -2.5, longitude: -54.8 },
    ]);

    expect(region.latitude).toBeCloseTo(-2.6);
    expect(region.longitude).toBeCloseTo(-54.9);
    expect(region.latitudeDelta).toBeCloseTo(0.25);
    expect(region.longitudeDelta).toBeCloseTo(0.25);
  });

  describe('Contract visual and accessibility helpers', () => {
    it('extracts color and icon directly from contract pin', () => {
      expect(getItemPinColor(pin)).toBe('#2563EB');
      expect(getItemPinIcon(pin)).toBe('bed');
      expect(getItemCategoryLabel(pin)).toBe('Hospedagem');
    });

    it('uses specialized type metadata for map icons and screen-reader labels', () => {
      const pharmacyPin: MapPin = {
        ...pin,
        category_slug: 'saude',
        category_label: 'Saúde',
        type_slug: 'farmacia',
        type_label: 'Farmácia & Drogaria',
        color: '#DC2626',
        icon: 'pill',
      };

      expect(getItemPinColor(pharmacyPin)).toBe('#DC2626');
      expect(getItemPinIcon(pharmacyPin)).toBe('pill');
      expect(getItemCategoryLabel(pharmacyPin)).toBe('Farmácia & Drogaria');
      expect(getItemAccessibilityLabel(pharmacyPin)).toBe(
        'Ponto no mapa: Ponto Pindobal. Categoria: Farmácia & Drogaria'
      );
    });

    it('rejects missing visual metadata instead of inventing production fallbacks', () => {
      const minimalItem = {
        id: '999',
        name: 'Ponto Genérico',
      };
      expect(getItemPinColor(minimalItem)).toBeNull();
      expect(getItemPinIcon(minimalItem)).toBeNull();
      expect(getItemCategoryLabel(minimalItem)).toBe('Geral');
    });

    it('generates rich accessible label for screen readers', () => {
      expect(getItemAccessibilityLabel(pin, false)).toBe(
        'Ponto no mapa: Ponto Pindobal. Categoria: Hospedagem'
      );
      expect(getItemAccessibilityLabel(pin, true)).toBe(
        'Ponto no mapa: Ponto Pindobal. Categoria: Hospedagem, selecionado'
      );
    });

    it('formats coordinates and generates accessible selection pin label (ECO-2311)', () => {
      const coord = { latitude: -2.4431, longitude: -54.7083 };
      expect(formatCoordinateDisplay(coord)).toBe('-2.4431, -54.7083');
      expect(getSelectionPinAccessibilityLabel(coord)).toBe(
        'Ponto de partida selecionado no mapa: -2.4431, -54.7083. Arraste para reposicionar.'
      );
      expect(getSelectionPinAccessibilityLabel(coord, 'Meu Ponto')).toBe(
        'Meu Ponto: -2.4431, -54.7083. Arraste para reposicionar.'
      );
      expect(getSelectionPinAccessibilityLabel(null)).toBe(
        'Ponto de partida selecionado no mapa'
      );
    });

    it('formats coordinates and generates accessible user location label (ECO-2609)', () => {
      const coord = { latitude: -2.4431, longitude: -54.7083 };
      expect(getUserLocationAccessibilityLabel(coord)).toBe(
        'Sua localização atual: -2.4431, -54.7083.'
      );
      expect(getUserLocationAccessibilityLabel(coord, 'Posição GPS')).toBe(
        'Posição GPS: -2.4431, -54.7083.'
      );
      expect(getUserLocationAccessibilityLabel(null)).toBe(
        'Sua localização atual'
      );
    });

    it('determina corretamente se uma coordenada está dentro dos limites territoriais da rota (ECO-2609)', () => {
      const routeBounds = { min_lat: -2.7, max_lat: -2.4, min_lng: -55.0, max_lng: -54.7 };

      // Ponto dentro do território (Pindobal / Santarém)
      const insideCoord = { latitude: -2.5, longitude: -54.9 };
      expect(isCoordinateWithinBounds(insideCoord, routeBounds)).toBe(true);

      // Ponto na margem aceitável
      const marginCoord = { latitude: -2.72, longitude: -54.9 };
      expect(isCoordinateWithinBounds(marginCoord, routeBounds, 0.05)).toBe(true);

      // Ponto em região distante (ex: Belém / São Paulo) que não deve criar corredor intermunicipal
      const distantCoord = { latitude: -1.4558, longitude: -48.4902 }; // Belém
      expect(isCoordinateWithinBounds(distantCoord, routeBounds)).toBe(false);
    });

    it('valida cores e icones contratuais da taxonomia canonica expandida', () => {
      expect(isContractPinColor('#D97706')).toBe(true);
      expect(isContractPinColor('#0D9488')).toBe(true);
      expect(isContractPinColor('invalid')).toBe(false);

      expect(isContractPinIcon('boat')).toBe(true);
      expect(isContractPinIcon('musical-notes')).toBe(true);
      expect(isContractPinIcon('store')).toBe(true);
      expect(isContractPinIcon('briefcase')).toBe(true);
      expect(isContractPinIcon('unknown-icon')).toBe(false);
    });
  });

  describe('filterPinsByModeAndCategory (ECO-2307)', () => {
    const pinsSample: MapPin[] = [
      {
        id: 'pin-corridor-1',
        actor_id: 'actor-1',
        name: 'Pousada Corredor',
        category_slug: 'hospedagem',
        category_label: 'Hospedagem',
        color: '#2563EB',
        icon: 'bed',
        latitude: -2.63,
        longitude: -54.94,
        layer: 'route_corridor',
      },
      {
        id: 'pin-city-1',
        actor_id: 'actor-2',
        name: 'Restaurante Cidade',
        category_slug: 'gastronomia',
        category_label: 'Gastronomia',
        color: '#D97706',
        icon: 'restaurant',
        latitude: -2.44,
        longitude: -54.72,
        layer: 'citywide_essential',
      },
      {
        id: 'pin-both-1',
        actor_id: 'actor-3',
        name: 'Guia Local Ambos',
        category_slug: 'experiencias',
        category_label: 'Experiências',
        color: '#059669',
        icon: 'compass',
        latitude: -2.55,
        longitude: -54.85,
        layer: 'both',
      },
      {
        id: 'pin-no-layer',
        actor_id: 'actor-4',
        name: 'Ponto Sem Camada Definida',
        category_slug: 'hospedagem',
        category_label: 'Hospedagem',
        color: '#2563EB',
        icon: 'bed',
        latitude: -2.60,
        longitude: -54.90,
        layer: 'route_corridor',
      },
    ];

    it('in route mode, only corridor, both, or default pins are included', () => {
      const result = filterPinsByModeAndCategory(pinsSample, 'route', '', null);
      expect(result.map((p) => p.id)).toEqual(['pin-corridor-1', 'pin-both-1', 'pin-no-layer']);
    });

    it('in route mode, preserves selection state without leaking a city pin into route layer', () => {
      const result = filterPinsByModeAndCategory(pinsSample, 'route', '', 'actor-2');
      expect(result.map((p) => p.id)).toEqual([
        'pin-corridor-1',
        'pin-both-1',
        'pin-no-layer',
      ]);
    });

    it('in city mode, all pins are included when no category filter is active', () => {
      const result = filterPinsByModeAndCategory(pinsSample, 'city', '', null);
      expect(result.map((p) => p.id)).toEqual([
        'pin-corridor-1',
        'pin-city-1',
        'pin-both-1',
        'pin-no-layer',
      ]);
    });

    it('in city mode with category filter, filters by category unless selectedActorId', () => {
      const result = filterPinsByModeAndCategory(pinsSample, 'city', 'hospedagem', null);
      expect(result.map((p) => p.id)).toEqual(['pin-corridor-1', 'pin-no-layer']);

      // When actor-2 (gastronomia) is selected, it must still be returned
      const resultWithSelected = filterPinsByModeAndCategory(
        pinsSample,
        'city',
        'hospedagem',
        'actor-2'
      );
      expect(resultWithSelected.map((p) => p.id)).toEqual([
        'pin-corridor-1',
        'pin-city-1',
        'pin-no-layer',
      ]);
    });

    it('supports city_bounds seamlessly in bounds coordinate helper', () => {
      const cityBounds = { min_lat: -2.8, max_lat: -2.4, min_lng: -55.2, max_lng: -54.5 };
      expect(getBoundsCoordinates(cityBounds)).toEqual([
        { latitude: -2.8, longitude: -55.2 },
        { latitude: -2.4, longitude: -54.5 },
      ]);
    });
  });

  describe('filterPinsByDensity (ECO-2608 / sem clusters e sem distorção de coordenadas)', () => {
    const densePins: MapPin[] = Array.from({ length: 30 }, (_, i) => ({
      id: `dense-pin-${i}`,
      actor_id: `actor-${i}`,
      name: `Ponto ${i}`,
      category_slug: i % 2 === 0 ? 'alimentacao' : 'hospedagem',
      category_label: i % 2 === 0 ? 'Alimentação' : 'Hospedagem',
      color: i % 2 === 0 ? '#D97706' : '#2563EB',
      icon: i % 2 === 0 ? 'utensils' : 'bed',
      latitude: -2.63 + (i % 3) * 0.0005,
      longitude: -54.94 + (i % 3) * 0.0005,
      layer: 'route_corridor',
    }));

    it('controla a densidade visual em zoom baixo exibindo apenas pins individuais sem bolhas numéricas', () => {
      const renderables = filterPinsByDensity(densePins, 12);
      expect(renderables.length).toBeLessThan(densePins.length);
      expect(renderables.length).toBeGreaterThan(0);

      // Nenhum item deve ser cluster ou possuir propriedades de cluster
      for (const item of renderables) {
        expect((item as any).isCluster).toBeUndefined();
        expect((item as any).count).toBeUndefined();
        expect(item.category_slug).toBeDefined();
        expect(item.color).toBeDefined();
        expect(item.icon).toBeDefined();
      }
    });

    it('revela progressivamente mais pins individuais quando o nível de zoom aumenta', () => {
      const lowZoomPins = filterPinsByDensity(densePins, 11);
      const midZoomPins = filterPinsByDensity(densePins, 13);
      const highZoomPins = filterPinsByDensity(densePins, 15);

      expect(midZoomPins.length).toBeGreaterThanOrEqual(lowZoomPins.length);
      expect(highZoomPins.length).toBeGreaterThan(midZoomPins.length);
      expect(highZoomPins.length).toBe(densePins.length);
    });

    it('mantém o empreendimento selecionado sempre visível e destacado mesmo em colisão de densidade', () => {
      const selectedId = 'actor-28';
      const renderables = filterPinsByDensity(densePins, 10, selectedId);

      const selectedRenderable = renderables.find(
        (r) => ('actor_id' in r ? r.actor_id === selectedId : r.id === selectedId)
      );
      expect(selectedRenderable).toBeDefined();
      expect(selectedRenderable?.name).toBe('Ponto 28');
    });

    it('preserva estritamente as coordenadas geográficas reais de cada pin sem aplicar offsets ou distorções', () => {
      const coincidentPins: MapPin[] = [
        {
          id: 'p1',
          actor_id: 'act-1',
          name: 'Barraca 1',
          category_slug: 'alimentacao',
          category_label: 'Alimentação',
          color: '#D97706',
          icon: 'utensils',
          latitude: -2.63000,
          longitude: -54.94000,
          layer: 'route_corridor',
        },
        {
          id: 'p2',
          actor_id: 'act-2',
          name: 'Barraca 2',
          category_slug: 'alimentacao',
          category_label: 'Alimentação',
          color: '#D97706',
          icon: 'utensils',
          latitude: -2.63000,
          longitude: -54.94000,
          layer: 'route_corridor',
        },
      ];

      const renderables = filterPinsByDensity(coincidentPins, 16);
      expect(renderables.length).toBe(2);

      const [p1, p2] = renderables;
      expect((p1 as any).offsetCoordinate).toBeUndefined();
      expect((p2 as any).offsetCoordinate).toBeUndefined();
      // Coordenadas originais permanecem estritamente preservadas
      expect(p1.latitude).toBe(-2.63000);
      expect(p1.longitude).toBe(-54.94000);
      expect(p2.latitude).toBe(-2.63000);
      expect(p2.longitude).toBe(-54.94000);
    });

    it('trata array vazio de forma resiliente', () => {
      expect(filterPinsByDensity([], 12)).toEqual([]);
    });
  });
});
