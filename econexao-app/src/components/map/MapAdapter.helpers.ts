import type { MapBounds, RouteGeometry } from '../../api/types';
import type { FlexiblePinItem, MapCoordinate, MapRenderableItem } from './MapAdapter.types';

const isFiniteCoordinate = (latitude: unknown, longitude: unknown): boolean =>
  typeof latitude === 'number' &&
  Number.isFinite(latitude) &&
  latitude >= -90 &&
  latitude <= 90 &&
  typeof longitude === 'number' &&
  Number.isFinite(longitude) &&
  longitude >= -180 &&
  longitude <= 180;

export const getItemId = (item: FlexiblePinItem): string =>
  ('actor_id' in item && item.actor_id ? item.actor_id : item.id) || '';

export const filterPinsByModeAndCategory = <T extends FlexiblePinItem>(
  pins: T[],
  mode: 'route' | 'city' = 'route',
  selectedCategory?: string | null,
  selectedActorId?: string | null
): T[] => {
  return pins.filter((pin) => {
    const pinId = getItemId(pin);
    const isSelected = Boolean(selectedActorId && (pinId === selectedActorId || ('actor_id' in pin && pin.actor_id === selectedActorId)));

    // Layer check
    const layer = 'layer' in pin ? pin.layer : undefined;
    if (mode === 'route') {
      const isInRouteLayer = !layer || layer === 'route_corridor' || layer === 'both';
      if (!isInRouteLayer) {
        return false;
      }
    }

    // Selection survives category changes within the active spatial layer, but
    // never leaks a citywide pin into the route camera.
    if (isSelected) {
      return true;
    }

    // Category filter check
    if (selectedCategory && selectedCategory.trim().length > 0) {
      const categorySlug = 'category_slug' in pin ? pin.category_slug : undefined;
      const segment = 'segment' in pin ? pin.segment : undefined;
      if (categorySlug !== selectedCategory && segment !== selectedCategory) {
        return false;
      }
    }

    return true;
  });
};

export const SELECTION_PIN_COLOR = '#EA580C';
export const USER_LOCATION_PIN_COLOR = '#0284C7';

export const CONTRACT_PIN_ICONS = [
  'anchor', 'bed', 'beer', 'briefcase', 'bus', 'car', 'church', 'coffee', 'compass',
  'cross', 'fuel', 'heart-pulse', 'help-circle', 'home', 'landmark', 'mountain',
  'palette', 'pill', 'plane', 'scale', 'shield', 'shield-check', 'ship',
  'shopping-cart', 'store', 'sun', 'trees', 'umbrella', 'utensils', 'waves',
] as const;

export const isContractPinColor = (value: unknown): value is string =>
  typeof value === 'string' && /^#[0-9A-Fa-f]{6}$/.test(value);

export const isContractPinIcon = (value: unknown): value is string =>
  typeof value === 'string' && (CONTRACT_PIN_ICONS as readonly string[]).includes(value);

export const formatCoordinateDisplay = (coord: MapCoordinate): string =>
  `${coord.latitude.toFixed(4)}, ${coord.longitude.toFixed(4)}`;

export const getSelectionPinAccessibilityLabel = (
  coord?: MapCoordinate | null,
  customLabel?: string
): string => {
  const base = customLabel || 'Ponto de partida selecionado no mapa';
  if (!coord) return base;
  return `${base}: ${formatCoordinateDisplay(coord)}. Arraste para reposicionar.`;
};

export const getUserLocationAccessibilityLabel = (
  coord?: MapCoordinate | null,
  customLabel?: string
): string => {
  const base = customLabel || 'Sua localização atual';
  if (!coord) return base;
  return `${base}: ${formatCoordinateDisplay(coord)}.`;
};

export const isCoordinateWithinBounds = (
  coord: MapCoordinate | null | undefined,
  bounds: MapBounds | null | undefined,
  marginDegrees = 0.05
): boolean => {
  if (!coord || !bounds) return false;
  if (
    !isFiniteCoordinate(coord.latitude, coord.longitude) ||
    !isFiniteCoordinate(bounds.min_lat, bounds.min_lng) ||
    !isFiniteCoordinate(bounds.max_lat, bounds.max_lng) ||
    bounds.min_lat > bounds.max_lat ||
    bounds.min_lng > bounds.max_lng
  ) {
    return false;
  }

  const minLat = bounds.min_lat - marginDegrees;
  const maxLat = bounds.max_lat + marginDegrees;
  const minLng = bounds.min_lng - marginDegrees;
  const maxLng = bounds.max_lng + marginDegrees;

  return (
    coord.latitude >= minLat &&
    coord.latitude <= maxLat &&
    coord.longitude >= minLng &&
    coord.longitude <= maxLng
  );
};

export const getItemPinColor = (item: FlexiblePinItem): string | null =>
  'color' in item && isContractPinColor(item.color) ? item.color : null;

export const getItemPinIcon = (item: FlexiblePinItem): string | null =>
  'icon' in item && isContractPinIcon(item.icon) ? item.icon : null;

export const getItemCategoryLabel = (item: FlexiblePinItem): string => {
  if (
    'type_label' in item &&
    typeof item.type_label === 'string' &&
    item.type_label.trim().length > 0
  ) {
    return item.type_label;
  }
  if (
    'category_label' in item &&
    typeof item.category_label === 'string' &&
    item.category_label.trim().length > 0
  ) {
    return item.category_label;
  }
  if ('category_slug' in item && item.category_slug) {
    return item.category_slug;
  }
  if ('segment' in item && item.segment) {
    return item.segment;
  }
  return 'Geral';
};

export const getItemAccessibilityLabel = (
  item: FlexiblePinItem,
  isSelected: boolean = false
): string => {
  const name = item.name || 'Ponto';
  const category = getItemCategoryLabel(item);
  const selectionStatus = isSelected ? ', selecionado' : '';
  return `Ponto no mapa: ${name}. Categoria: ${category}${selectionStatus}`;
};

export const getItemCategory = (item: FlexiblePinItem): string =>
  ('category_slug' in item && item.category_slug
    ? item.category_slug
    : 'segment' in item && item.segment
    ? item.segment
    : 'todos');

export const getItemCoordinate = (item: FlexiblePinItem): MapCoordinate | null => {
  if (
    'latitude' in item &&
    typeof item.latitude === 'number' &&
    typeof item.longitude === 'number' &&
    isFiniteCoordinate(item.latitude, item.longitude)
  ) {
    return { latitude: item.latitude, longitude: item.longitude };
  }

  if (
    'coordinate' in item &&
    item.coordinate &&
    typeof item.coordinate.latitude === 'number' &&
    typeof item.coordinate.longitude === 'number' &&
    isFiniteCoordinate(item.coordinate.latitude, item.coordinate.longitude)
  ) {
    return {
      latitude: item.coordinate.latitude,
      longitude: item.coordinate.longitude,
    };
  }

  return null;
};

export const getGeometryCoordinates = (
  geometry?: RouteGeometry | null
): MapCoordinate[] => {
  const coordinates = (geometry?.geojson as { coordinates?: [number, number][] } | null | undefined)?.coordinates;
  if (!Array.isArray(coordinates)) return [];

  return coordinates.flatMap(([longitude, latitude]) =>
    isFiniteCoordinate(latitude, longitude) ? [{ latitude, longitude }] : []
  );
};

export const getBoundsCoordinates = (bounds?: MapBounds | null): MapCoordinate[] => {
  if (
    !bounds ||
    !isFiniteCoordinate(bounds.min_lat, bounds.min_lng) ||
    !isFiniteCoordinate(bounds.max_lat, bounds.max_lng) ||
    bounds.min_lat > bounds.max_lat ||
    bounds.min_lng > bounds.max_lng
  ) {
    return [];
  }

  return [
    { latitude: bounds.min_lat, longitude: bounds.min_lng },
    { latitude: bounds.max_lat, longitude: bounds.max_lng },
  ];
};

export const getFitCoordinates = (
  bounds: MapBounds | null | undefined,
  geometry: RouteGeometry | null | undefined,
  items: FlexiblePinItem[]
): MapCoordinate[] => {
  const boundsCoordinates = getBoundsCoordinates(bounds);
  return boundsCoordinates;
};

export const getInitialRegion = (
  coordinates: MapCoordinate[]
): {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
} => {
  if (!coordinates.length) {
    return {
      latitude: -2.636,
      longitude: -54.936,
      latitudeDelta: 0.45,
      longitudeDelta: 0.45,
    };
  }

  const latitudes = coordinates.map(({ latitude }) => latitude);
  const longitudes = coordinates.map(({ longitude }) => longitude);
  const minLatitude = Math.min(...latitudes);
  const maxLatitude = Math.max(...latitudes);
  const minLongitude = Math.min(...longitudes);
  const maxLongitude = Math.max(...longitudes);

  return {
    latitude: (minLatitude + maxLatitude) / 2,
    longitude: (minLongitude + maxLongitude) / 2,
    latitudeDelta: Math.max((maxLatitude - minLatitude) * 1.25, 0.01),
    longitudeDelta: Math.max((maxLongitude - minLongitude) * 1.25, 0.01),
  };
};

/**
 * Prioridade de renderização estável por relevância de categoria em caso de colisão.
 */
const CATEGORY_VISUAL_PRIORITY: Record<string, number> = {
  atrativos: 10,
  alimentacao: 9,
  hospedagem: 8,
  artesanato: 7,
  transporte: 6,
  saude: 5,
  seguranca: 4,
  outros: 1,
};

/**
 * Controla a densidade e colisões visuais de pins no mapa sem agrupamentos numéricos (clusters).
 * - Pins são exibidos individualmente com sua cor e ícone de categoria (ADR 0010).
 * - O item selecionado (selectedActorId) SEMPRE é incluído e destacado com máxima prioridade.
 * - Conforme o zoom aumenta, mais pontos são revelados.
 * - Coordenadas geográficas reais são estritamente preservadas (sem offsets ou distorções).
 */
export const filterPinsByDensity = (
  items: FlexiblePinItem[],
  zoomLevel: number,
  selectedActorId?: string | null
): MapRenderableItem[] => {
  if (items.length === 0) return [];

  // Em zoom alto (>= 15), todos os pins válidos são renderizados diretamente com suas coordenadas reais
  if (zoomLevel >= 15) {
    return items.filter((item) => getItemCoordinate(item) !== null);
  }

  // Raio de colisão em pixels na tela convertido para graus no zoom atual
  // Zoom baixo: raio maior (reduz sobreposição visual e poluição)
  // Zoom alto: raio menor (revela mais pontos)
  const pixelCollisionRadius = Math.max(18, 42 - (zoomLevel - 10) * 4);
  const radiusDeg = (pixelCollisionRadius * 360) / (256 * Math.pow(2, Math.min(zoomLevel, 18)));

  const validItems: { item: FlexiblePinItem; coord: MapCoordinate; isSelected: boolean; priority: number }[] = [];
  let selectedEntry: { item: FlexiblePinItem; coord: MapCoordinate } | null = null;

  for (let idx = 0; idx < items.length; idx++) {
    const item = items[idx];
    const coord = getItemCoordinate(item);
    if (!coord) continue;

    const isSelected = Boolean(
      selectedActorId &&
        (getItemId(item) === selectedActorId ||
          ('actor_id' in item && item.actor_id === selectedActorId))
    );

    const categorySlug = getItemCategory(item);
    const catPriority = CATEGORY_VISUAL_PRIORITY[categorySlug] || 2;
    // Score de prioridade: selecionado = 10000, verificado/destaque = 100, categoria = 1..10, ordem de entrada estável
    const isVerified = 'verification_status' in item && item.verification_status === 'verified';
    const isFeatured = 'is_featured' in item && (item as any).is_featured === true;
    const priority = (isSelected ? 10000 : 0) + (isFeatured ? 200 : 0) + (isVerified ? 100 : 0) + catPriority * 10 - idx * 0.001;

    if (isSelected) {
      selectedEntry = { item, coord };
    }

    validItems.push({ item, coord, isSelected, priority });
  }

  // Ordenar candidatos por prioridade decrescente para que itens mais relevantes ganhem o espaço visual
  validItems.sort((a, b) => b.priority - a.priority);

  const acceptedPins: FlexiblePinItem[] = [];
  const acceptedCoords: MapCoordinate[] = [];

  // Se houver item selecionado, garantir como primeiro aceito
  if (selectedEntry) {
    acceptedPins.push(selectedEntry.item);
    acceptedCoords.push(selectedEntry.coord);
  }

  for (const candidate of validItems) {
    if (candidate.isSelected) continue; // Já incluído

    let collides = false;
    for (const acceptedCoord of acceptedCoords) {
      const dLat = candidate.coord.latitude - acceptedCoord.latitude;
      const dLng = candidate.coord.longitude - acceptedCoord.longitude;
      const dist = Math.sqrt(dLat * dLat + dLng * dLng);
      if (dist < radiusDeg) {
        collides = true;
        break;
      }
    }

    if (!collides) {
      acceptedPins.push(candidate.item);
      acceptedCoords.push(candidate.coord);
    }
  }

  return acceptedPins;
};

/**
 * @deprecated Mantido para compatibilidade retroativa. Delegado para filterPinsByDensity.
 */
export const clusterPins = filterPinsByDensity;
