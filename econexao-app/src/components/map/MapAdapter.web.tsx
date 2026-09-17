import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import L, { type LatLngBoundsExpression, type Map as LeafletMap } from 'leaflet';
import { MapContainer, Marker, Polyline, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

import { theme } from '../../theme/theme';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { MapControls } from './MapControls';
import {
  SELECTION_PIN_COLOR,
  USER_LOCATION_PIN_COLOR,
  filterPinsByDensity,
  formatCoordinateDisplay,
  getFitCoordinates,
  getGeometryCoordinates,
  getInitialRegion,
  getItemAccessibilityLabel,
  getItemCategoryLabel,
  getItemCoordinate,
  getItemId,
  getItemPinColor,
  getItemPinIcon,
  getSelectionPinAccessibilityLabel,
  getUserLocationAccessibilityLabel,
} from './MapAdapter.helpers';
import type { FlexiblePinItem, MapAdapterProps, MapCoordinate } from './MapAdapter.types';

const MIN_ZOOM = 3;
const MAX_ZOOM = 19;
const PIN_ENTER_CLASS = 'econexao-pin-enter';
const PIN_SELECTED_CLASS = 'econexao-pin-selected';

const ensurePinMotionStyles = () => {
  if (typeof document === 'undefined' || document.getElementById('econexao-pin-motion-styles')) return;
  const style = document.createElement('style');
  style.id = 'econexao-pin-motion-styles';
  style.textContent = `
    @keyframes econexao-pin-enter { from { opacity: 0; transform: translateY(6px) scale(.88); } to { opacity: 1; transform: translateY(0) scale(1); } }
    @keyframes econexao-pin-selected { from { transform: scale(.94); } 60% { transform: scale(1.06); } to { transform: scale(1); } }
    .${PIN_ENTER_CLASS} { animation: econexao-pin-enter 180ms cubic-bezier(.2,0,0,1) both; transform-origin: 50% 100%; }
    .${PIN_SELECTED_CLASS} { animation: econexao-pin-selected 180ms cubic-bezier(.2,0,0,1) both; transform-origin: 50% 100%; }
    @media (prefers-reduced-motion: reduce) { .${PIN_ENTER_CLASS}, .${PIN_SELECTED_CLASS} { animation: none !important; } }
  `;
  document.head.appendChild(style);
};

const toLeafletBounds = (coordinates: MapCoordinate[]): LatLngBoundsExpression | null =>
  coordinates.length
    ? coordinates.map(({ latitude, longitude }) => [latitude, longitude] as [number, number])
    : null;

const getPinIconSvg = (iconName: string): string | null => {
  switch (iconName) {
    case 'flag':
      return '<path d="M5 22V4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M5 4h11l-2 4 2 4H5" stroke="currentColor" stroke-width="2" stroke-linejoin="round" fill="none"/>';
    case 'user-location':
      return '<circle cx="12" cy="12" r="4" fill="currentColor"/><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2" fill="none"/>';
    case 'pin':
    case 'selection-pin':
      return '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="currentColor"/><line x1="4" y1="22" x2="4" y2="15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>';
    case 'utensils':
    case 'restaurant':
      return '<path d="M18 2v6a3 3 0 0 1-3 3 3 3 0 0 1-3-3V2M15 2v20M5 2v7a3 3 0 0 0 3 3v10M8 2v4M2 2v4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>';
    case 'beer':
      return '<path d="M5 8h10v12H5zM15 10h2a3 3 0 0 1 0 6h-2M7 4h6M8 4v4M12 4v4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>';
    case 'coffee':
      return '<path d="M4 9h14v5a6 6 0 0 1-6 6H10a6 6 0 0 1-6-6V9zM18 11h1a3 3 0 0 1 0 6h-2M8 2v3M12 2v3" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/>';
    case 'compass':
      return '<circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" fill="currentColor"/>';
    case 'bed':
      return '<path d="M2 4v16M2 8h18a2 2 0 0 1 2 2v10M2 17h20M6 8v9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>';
    case 'palette':
      return '<circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.563-2.512 5.563-5.563C22 6.5 17.5 2 12 2z" stroke="currentColor" stroke-width="2" fill="none"/>';
    case 'bus':
      return '<rect x="3" y="3" width="18" height="15" rx="2" stroke="currentColor" stroke-width="2" fill="none"/><path d="M3 9h18M3 14h18M6 18v2M18 18v2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>';
    case 'fuel':
      return '<path d="M4 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18M2 22h16M7 6h6v5H7zM16 7h2l2 2v8a2 2 0 0 0 2 2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>';
    case 'car':
      return '<path d="M5 17h14l1-5-3-5H7l-3 5 1 5zM7 17v3M17 17v3M7 13h.01M17 13h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>';
    case 'plane':
      return '<path d="M22 2 9 15M22 2l-7 20-4-9-9-4 20-7z" stroke="currentColor" stroke-width="2" stroke-linejoin="round" fill="none"/>';
    case 'anchor':
    case 'ship':
      return '<path d="M12 2v18M5 9h14M5 14a7 7 0 0 0 14 0M9 5a3 3 0 1 0 6 0" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/>';
    case 'heart-pulse':
    case 'cross':
    case 'medkit':
      return '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" stroke="currentColor" stroke-width="2" fill="none"/><path d="M3.22 12H9.5l1.5-3 2 6 1.5-3h4.28" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>';
    case 'pill':
      return '<path d="m10.5 20.5-7-7a5 5 0 0 1 7-7l7 7a5 5 0 0 1-7 7zM7 17l10-10" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/>';
    case 'shield':
    case 'shield-check':
      return '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>';
    case 'help-circle':
      return '<circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="12" y1="17" x2="12.01" y2="17" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>';
    case 'briefcase':
    case 'church':
    case 'home':
    case 'landmark':
    case 'mountain':
    case 'scale':
    case 'shopping-cart':
    case 'store':
    case 'sun':
    case 'trees':
    case 'umbrella':
    case 'waves':
      return '<path d="M4 10h16v10H4zM2 10l10-7 10 7M8 20v-6h8v6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>';
    default:
      return null;
  }
};

function escapeHtml(value: unknown): string {
  if (value == null) return '';
  const str = String(value);
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const createPinIcon = (
  item: FlexiblePinItem,
  selected: boolean,
  variant: 'full' | 'simple' = 'full',
  motionClass = '',
  actorSummary?: {
    google_rating?: number | null;
    rating_count?: number | null;
    cover_image_url?: string | null;
    cover_media?: { url?: string | null; derivatives?: { card?: string | null; thumbnail?: string | null } | null } | null;
  }
) => {
  const rawColor = getItemPinColor(item);
  const icon = getItemPinIcon(item);
  if (!rawColor || !icon) return null;
  const color = escapeHtml(rawColor);
  const iconSvg = getPinIconSvg(icon);
  if (!iconSvg) return null;

  if (selected) {
    const isSimple = variant === 'simple';
    const cardWidth = isSimple ? 220 : 260;
    const name = escapeHtml(item.name || 'Ponto');
    const categoryLabel = escapeHtml(getItemCategoryLabel(item));
    const photoUrl = actorSummary?.cover_media?.derivatives?.card ||
      actorSummary?.cover_media?.url ||
      actorSummary?.cover_image_url;
    const rating = actorSummary?.google_rating;
    const ratingCount = actorSummary?.rating_count;

    const photoHtml = !isSimple
      ? photoUrl
        ? `<div style="width:72px;height:72px;border-radius:8px;overflow:hidden;background:#f3f4f6;flex-shrink:0;">
             <img src="${escapeHtml(photoUrl)}" alt="${name}" style="width:100%;height:100%;object-fit:cover;" />
           </div>`
        : `<div style="width:72px;height:72px;border-radius:8px;background:${color}18;display:flex;align-items:center;justify-content:center;flex-shrink:0;color:${color};">
             <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${iconSvg}</svg>
           </div>`
      : '';

    const ratingHtml = !isSimple && typeof rating === 'number' && Number.isFinite(rating)
      ? `<div style="display:flex;align-items:center;gap:4px;font-size:11px;font-weight:700;color:#1e293b;">
           <span style="color:#F59E0B;">★</span> ${rating.toFixed(1)}${ratingCount ? ` <span style="font-weight:400;color:#64748b;">(${ratingCount})</span>` : ''}
         </div>`
      : '';

    const actionText = isSimple ? 'Ver no mapa' : 'Ver detalhes';

    const cardHtml = `
      <div class="econexao-selected-pin-card ${motionClass}" style="position:relative;width:${cardWidth}px;background:#ffffff;border-radius:12px;padding:${isSimple ? '10px 12px' : '10px'};box-shadow:0 8px 24px rgba(0,0,0,0.22);border:1px solid rgba(0,0,0,0.08);cursor:pointer;user-select:none;font-family:system-ui,-apple-system,sans-serif;">
        <div style="display:flex;flex-direction:${isSimple ? 'column' : 'row'};align-items:${isSimple ? 'stretch' : 'center'};gap:${isSimple ? '6px' : '10px'};">
          ${photoHtml}
          <div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:3px;">
            <div style="display:flex;align-items:center;gap:4px;">
              <span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:${color};"></span>
              <span style="font-size:10px;font-weight:700;color:${color};text-transform:uppercase;letter-spacing:0.5px;">${categoryLabel}</span>
            </div>
            <div style="font-size:13px;font-weight:700;color:#0f172a;line-height:16px;overflow:hidden;text-overflow:ellipsis;white-space:${isSimple ? 'normal' : 'nowrap'};">${name}</div>
            ${ratingHtml}
            <div style="display:flex;align-items:center;gap:4px;font-size:11px;font-weight:700;color:#1e3a8a;margin-top:2px;">
              ${actionText} →
            </div>
          </div>
        </div>
        <div style="position:absolute;bottom:-10px;left:50%;transform:translateX(-50%);width:0;height:0;border-left:8px solid transparent;border-right:8px solid transparent;border-top:10px solid #ffffff;filter:drop-shadow(0 2px 2px rgba(0,0,0,0.15));"></div>
      </div>
    `;

    return L.divIcon({
      className: 'econexao-selected-card-wrapper',
      html: cardHtml,
      iconSize: [cardWidth, isSimple ? 90 : 105],
      iconAnchor: [cardWidth / 2, isSimple ? 100 : 115],
    });
  }

  // Teardrop Marker (38px x 46px) com ancoragem exata na ponta inferior (19, 46)
  const width = 38;
  const height = 46;
  const iconSize = 18;

  const teardropHtml = `
    <div class="econexao-teardrop-marker ${motionClass}" style="width:${width}px;height:${height}px;position:relative;filter:drop-shadow(0 3px 6px rgba(0,0,0,0.3));cursor:pointer;transition:transform 0.15s ease;">
      <svg width="${width}" height="${height}" viewBox="0 0 38 46" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:block;">
        <path d="M19 45C19 45 36 27.5 36 18C36 8.61116 28.3888 1 19 1C9.61116 1 2 8.61116 2 18C2 27.5 19 45 19 45Z" fill="${color}" stroke="#FFFFFF" stroke-width="1.5" stroke-linejoin="round"/>
        <g transform="translate(10, 9)" stroke="#FFFFFF" color="#FFFFFF">
          <svg width="${iconSize}" height="${iconSize}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            ${iconSvg}
          </svg>
        </g>
      </svg>
    </div>
  `;

  return L.divIcon({
    className: 'econexao-teardrop-wrapper',
    html: teardropHtml,
    iconSize: [width, height],
    iconAnchor: [width / 2, height],
  });
};


const createSelectionPinIcon = () => {
  const size = 42;
  const iconSize = 20;
  const color = SELECTION_PIN_COLOR;
  const svgContent = getPinIconSvg('flag');
  const ringStyle =
    'box-shadow:0 0 0 3px #FFFFFF, 0 0 0 6px rgba(234,88,12,0.8), 0 6px 16px rgba(0,0,0,0.45); transform:scale(1.1);';

  const html = `
    <div style="display:flex;align-items:center;justify-content:center;width:${size}px;height:${size}px;border-radius:50%;background:${color};border:3px solid #FFFFFF;color:#FFFFFF;transition:transform 0.15s ease,box-shadow 0.15s ease;cursor:grab;${ringStyle}" aria-label="Marcador de seleção">
      <svg width="${iconSize}" height="${iconSize}" viewBox="0 0 24 24" fill="none" style="display:block;" aria-hidden="true">
        ${svgContent}
      </svg>
    </div>
  `;

  return L.divIcon({
    className: 'econexao-selection-marker',
    html,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

const createUserLocationPinIcon = () => {
  const size = 38;
  const iconSize = 18;
  const color = USER_LOCATION_PIN_COLOR;
  const svgContent = getPinIconSvg('user-location');
  const ringStyle =
    'box-shadow:0 0 0 3px #FFFFFF, 0 0 0 6px rgba(2,132,199,0.75), 0 4px 12px rgba(0,0,0,0.35); transform:scale(1.05);';

  const html = `
    <div class="econexao-user-location-marker" style="display:flex;align-items:center;justify-content:center;width:${size}px;height:${size}px;border-radius:50%;background:${color};border:2.5px solid #FFFFFF;color:#FFFFFF;transition:transform 0.15s ease,box-shadow 0.15s ease;${ringStyle}" aria-label="Sua localização atual">
      <svg width="${iconSize}" height="${iconSize}" viewBox="0 0 24 24" fill="none" style="display:block;" aria-hidden="true">
        ${svgContent}
      </svg>
    </div>
  `;

  return L.divIcon({
    className: 'econexao-user-location-marker-wrapper',
    html,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

const MapEventsHandler: React.FC<{
  selectionMode?: boolean;
  onSelectCoordinate?: (coord: MapCoordinate) => void;
  onZoomChange: (zoom: number) => void;
}> = ({ selectionMode, onSelectCoordinate, onZoomChange }) => {
  const map = useMap();

  useMapEvents({
    click: (e) => {
      if (selectionMode && onSelectCoordinate) {
        onSelectCoordinate({ latitude: e.latlng.lat, longitude: e.latlng.lng });
      }
    },
    zoomend: () => onZoomChange(map.getZoom()),
  });

  return null;
};

const CameraSync: React.FC<{
  bounds: LatLngBoundsExpression | null;
  onZoomChange?: (zoom: number) => void;
}> = ({ bounds, onZoomChange }) => {
  const map = useMap();

  useEffect(() => {
    if (bounds && map) {
      try {
        map.fitBounds(bounds, { padding: [52, 52], animate: false });
        onZoomChange?.(map.getZoom());
      } catch {}
    }
  }, [bounds, map, onZoomChange]);

  return null;
};

const AccessibilitySync: React.FC = () => {
  const map = useMap();

  useEffect(() => {
    const container = map.getContainer();
    if (container) {
      container.setAttribute('role', 'region');
      container.setAttribute('aria-label', 'Mapa interativo da Rota');
      const tilePane = container.querySelector<HTMLElement>('.leaflet-tile-pane');
      if (tilePane) {
        tilePane.setAttribute('aria-hidden', 'true');
      }
      const attribution = container.querySelector<HTMLElement>('.leaflet-control-attribution');
      if (attribution) {
        attribution.setAttribute('aria-label', 'Atribuição dos mapas');
      }
    }
  }, [map]);

  return null;
};

export const MapAdapter: React.FC<MapAdapterProps> = ({
  actors,
  pins,
  geometry,
  bounds,
  selectedActorId,
  onSelectActor,
  height = 360,
  showControls = true,
  selectionMode = false,
  selectedCoordinate,
  onSelectCoordinate,
  selectionPinLabel,
  userLocation,
  userLocationLabel,
  pinCardVariant = 'full',
  actorSummaries,
}) => {
  const mapRef = useRef<LeafletMap | null>(null);
  const items = pins ?? actors ?? [];
  const routeCoordinates = useMemo(() => getGeometryCoordinates(geometry), [geometry]);
  const fitCoordinates = useMemo(
    () => getFitCoordinates(bounds, geometry, items),
    [bounds, geometry, items]
  );
  const prefersReducedMotion = useReducedMotion();
  const seenPinIdsRef = useRef<Set<string>>(new Set());
  const motionRouteSignature = useMemo(() => JSON.stringify(routeCoordinates), [routeCoordinates]);
  const previousMotionRouteSignatureRef = useRef(motionRouteSignature);

  useEffect(() => {
    ensurePinMotionStyles();
    if (previousMotionRouteSignatureRef.current !== motionRouteSignature) {
      seenPinIdsRef.current.clear();
      previousMotionRouteSignatureRef.current = motionRouteSignature;
    }
  }, [motionRouteSignature]);
  const leafletBounds = useMemo(() => toLeafletBounds(fitCoordinates), [fitCoordinates]);
  const initialRegion = useMemo(() => getInitialRegion(fitCoordinates), [fitCoordinates]);

  const calculatedInitialZoom = useMemo(() => {
    const maxDelta = Math.max(initialRegion.latitudeDelta, initialRegion.longitudeDelta);
    if (!maxDelta || maxDelta <= 0) return 12;
    return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, Math.floor(Math.log2(360 / maxDelta))));
  }, [initialRegion]);

  const [zoomLevel, setZoomLevel] = useState(calculatedInitialZoom);

  useEffect(() => {
    setZoomLevel(calculatedInitialZoom);
  }, [calculatedInitialZoom]);

  // Map of actor summaries for quick lookup by ID
  const actorSummariesById = useMemo(() => {
    const map = new Map<string, NonNullable<MapAdapterProps['actorSummaries']>[0]>();
    if (actorSummaries) {
      for (const summary of actorSummaries) {
        if (summary.id) map.set(summary.id, summary);
      }
    }
    return map;
  }, [actorSummaries]);

  // Controle determinístico de densidade e colisão por nível de zoom
  const renderableItems = useMemo(
    () => filterPinsByDensity(items, zoomLevel, selectedActorId),
    [items, zoomLevel, selectedActorId]
  );
  useEffect(() => {
    renderableItems.forEach((item) => seenPinIdsRef.current.add(getItemId(item)));
  }, [renderableItems]);

  const recenter = useCallback(() => {
    if (leafletBounds && mapRef.current) {
      try {
        mapRef.current.fitBounds(leafletBounds, { padding: [52, 52], animate: true });
      } catch {}
    } else if (mapRef.current) {
      try {
        mapRef.current.setView([initialRegion.latitude, initialRegion.longitude], calculatedInitialZoom, {
          animate: true,
        });
      } catch {}
    }
  }, [calculatedInitialZoom, initialRegion, leafletBounds]);

  const changeZoom = useCallback((delta: number) => {
    const map = mapRef.current;
    if (!map) return;
    try {
      const nextZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, map.getZoom() + delta));
      map.setZoom(nextZoom, { animate: true });
      setZoomLevel(nextZoom);
    } catch {}
  }, []);

  const selectionPinA11y = useMemo(
    () => getSelectionPinAccessibilityLabel(selectedCoordinate, selectionPinLabel),
    [selectedCoordinate, selectionPinLabel]
  );

  const userLocationA11y = useMemo(
    () => getUserLocationAccessibilityLabel(userLocation, userLocationLabel),
    [userLocation, userLocationLabel]
  );

  return (
    <View
      style={[styles.container, { height }]}
      accessibilityLabel="Mapa interativo da rota, com percurso e pontos selecionáveis"
    >
      <MapContainer
        ref={mapRef}
        center={[initialRegion.latitude, initialRegion.longitude]}
        zoom={calculatedInitialZoom}
        minZoom={MIN_ZOOM}
        maxZoom={MAX_ZOOM}
        style={{ width: '100%', height: '100%' }}
        zoomControl={false}
      >
        <AccessibilitySync />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <CameraSync bounds={leafletBounds} onZoomChange={setZoomLevel} />
        <MapEventsHandler
          selectionMode={selectionMode}
          onSelectCoordinate={onSelectCoordinate}
          onZoomChange={setZoomLevel}
        />

        {routeCoordinates.length >= 2 && (
          <Polyline
            positions={routeCoordinates.map(({ latitude, longitude }) => [latitude, longitude])}
            pathOptions={{ color: theme.colors.brandForest, weight: 5 }}
          />
        )}

        {renderableItems.map((item) => {
          const coordinate = getItemCoordinate(item);
          if (!coordinate) return null;
          const itemId = getItemId(item);
          const isSelected = itemId === selectedActorId;
          const a11yLabel = getItemAccessibilityLabel(item, isSelected);
          const actorSummary = actorSummariesById.get(itemId);
          const firstSeen = !seenPinIdsRef.current.has(itemId);
          const motionClass = prefersReducedMotion ? '' : isSelected ? PIN_SELECTED_CLASS : firstSeen ? PIN_ENTER_CLASS : '';
          const pinIcon = createPinIcon(item, isSelected, pinCardVariant, motionClass, actorSummary);
          if (!pinIcon) return null;

          return (
            <Marker
              key={itemId}
              position={[coordinate.latitude, coordinate.longitude]}
              icon={pinIcon}
              title={a11yLabel}
              alt={a11yLabel}
              keyboard={true}
              eventHandlers={{
                click: (e) => {
                  L.DomEvent.stopPropagation(e as any);
                  onSelectActor(itemId);
                },
                keypress: (e: any) => {
                  if (e.originalEvent?.key === 'Enter' || e.originalEvent?.key === ' ') {
                    e.originalEvent?.preventDefault?.();
                    L.DomEvent.stopPropagation(e as any);
                    onSelectActor(itemId);
                  }
                },
              }}
              zIndexOffset={isSelected ? 1000 : 0}
            />
          );
        })}

        {/* Marcador da Posição do Usuário em Primeiro Plano */}
        {userLocation && (
          <Marker
            position={[userLocation.latitude, userLocation.longitude]}
            icon={createUserLocationPinIcon()}
            title={userLocationA11y}
            alt={userLocationA11y}
            keyboard={true}
            zIndexOffset={1500}
            eventHandlers={{
              click: (e) => {
                L.DomEvent.stopPropagation(e as any);
              },
            }}
          />
        )}

        {selectedCoordinate && (
          <Marker
            position={[selectedCoordinate.latitude, selectedCoordinate.longitude]}
            icon={createSelectionPinIcon()}
            title={selectionPinA11y}
            alt={selectionPinA11y}
            draggable={true}
            zIndexOffset={2000}
            eventHandlers={{
              click: (e) => {
                L.DomEvent.stopPropagation(e as any);
              },
              dragend: (e) => {
                const marker = e.target;
                const latlng = marker.getLatLng();
                if (onSelectCoordinate) {
                  onSelectCoordinate({ latitude: latlng.lat, longitude: latlng.lng });
                }
              },
            }}
          />
        )}
      </MapContainer>

      {showControls && (
        <MapControls
          onZoomIn={() => changeZoom(1)}
          onZoomOut={() => changeZoom(-1)}
          onRecenter={recenter}
          canZoomIn={zoomLevel < MAX_ZOOM}
          canZoomOut={zoomLevel > MIN_ZOOM}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: theme.colors.surfaceContainerLow,
  },
});
