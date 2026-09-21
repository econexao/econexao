import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, Polyline, type LatLng, type Region } from 'react-native-maps';

import { theme } from '../../theme/theme';
import { MapControls } from './MapControls';
import { SelectedPinCard } from './SelectedPinCard';
import {
  ROUTE_DESTINATION_PIN_COLOR,
  ROUTE_START_PIN_COLOR,
  SELECTION_PIN_COLOR,
  USER_LOCATION_PIN_COLOR,
  filterPinsByDensity,
  getFitCoordinates,
  getGeometryCoordinates,
  getInitialRegion,
  getItemAccessibilityLabel,
  getItemCategoryLabel,
  getItemCoordinate,
  getItemId,
  getItemPinColor,
  getItemPinIcon,
  getRouteDestinationPinAccessibilityLabel,
  getRouteEndpoints,
  getRouteStartPinAccessibilityLabel,
  getSelectionPinAccessibilityLabel,
  getUserLocationAccessibilityLabel,
} from './MapAdapter.helpers';
import type { MapAdapterProps } from './MapAdapter.types';
import { getCategoryIonicons } from '../catalog/CategoryFilters';

const MIN_ZOOM = 3;
const MAX_ZOOM = 20;
const EDGE_PADDING = { top: 52, right: 52, bottom: 52, left: 52 };

const regionToZoom = (region: Region): number =>
  Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, Math.log2(360 / region.longitudeDelta)));

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
  const mapRef = useRef<MapView>(null);
  const [zoomLevel, setZoomLevel] = useState(12);
  const items = pins ?? actors ?? [];
  const routeCoordinates = useMemo(() => getGeometryCoordinates(geometry), [geometry]);
  const fitCoordinates = useMemo(
    () => getFitCoordinates(bounds, geometry, items),
    [bounds, geometry, items]
  );
  const initialRegion = useMemo(() => getInitialRegion(fitCoordinates), [fitCoordinates]);

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

  // Controle de densidade de pins por zoom level sem clusters
  const renderableItems = useMemo(
    () => filterPinsByDensity(items, zoomLevel, selectedActorId),
    [items, zoomLevel, selectedActorId]
  );

  const boundsSignature = useMemo(() => {
    if (bounds) return JSON.stringify(bounds);
    if (geometry?.id) return `geo-${geometry.id}`;
    return 'initial-load';
  }, [bounds, geometry?.id]);

  const lastFittedSignatureRef = useRef<string | null>(null);

  const recenter = useCallback(() => {
    if (fitCoordinates.length >= 2) {
      mapRef.current?.fitToCoordinates(fitCoordinates as LatLng[], {
        edgePadding: EDGE_PADDING,
        animated: true,
      });
      return;
    }

    mapRef.current?.animateToRegion(initialRegion, 300);
  }, [fitCoordinates, initialRegion]);

  useEffect(() => {
    if (lastFittedSignatureRef.current !== boundsSignature) {
      lastFittedSignatureRef.current = boundsSignature;
      recenter();
    }
  }, [boundsSignature, recenter]);

  const changeZoom = useCallback(async (delta: number) => {
    const nextZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoomLevel + delta));
    const camera = await mapRef.current?.getCamera();
    if (!camera) return;
    mapRef.current?.animateCamera({ ...camera, zoom: nextZoom }, { duration: 250 });
    setZoomLevel(nextZoom);
  }, [zoomLevel]);

  const routeEndpoints = useMemo(() => getRouteEndpoints(geometry), [geometry]);
  const isStartSelected = selectedActorId === 'route-start';
  const isDestinationSelected = selectedActorId === 'route-destination';
  const routeStartA11y = useMemo(
    () => getRouteStartPinAccessibilityLabel(routeEndpoints.start),
    [routeEndpoints.start]
  );
  const routeDestinationA11y = useMemo(
    () => getRouteDestinationPinAccessibilityLabel(routeEndpoints.destination),
    [routeEndpoints.destination]
  );

  const selectionPinA11y = useMemo(
    () => getSelectionPinAccessibilityLabel(selectedCoordinate, selectionPinLabel),
    [selectedCoordinate, selectionPinLabel]
  );

  const userLocationA11y = useMemo(
    () => getUserLocationAccessibilityLabel(userLocation, userLocationLabel),
    [userLocation, userLocationLabel]
  );

  return (
    <View style={[styles.container, { height }]}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        initialRegion={initialRegion}
        onMapReady={recenter}
        onRegionChangeComplete={(region) => setZoomLevel(regionToZoom(region))}
        onPress={(e) => {
          if (selectionMode && onSelectCoordinate) {
            onSelectCoordinate(e.nativeEvent.coordinate);
          }
        }}
        minZoomLevel={MIN_ZOOM}
        maxZoomLevel={MAX_ZOOM}
        accessibilityLabel="Mapa interativo da rota, com percurso e pontos selecionáveis"
        accessibilityHint="Use os controles de zoom e recentralização ou selecione um ponto da rota"
      >
        {routeCoordinates.length >= 2 && (
          <Polyline
            coordinates={routeCoordinates as LatLng[]}
            strokeColor={theme.colors.brandForest}
            strokeWidth={5}
          />
        )}

        {/* Marcador de Início da Rota (Origem) */}
        {routeEndpoints.start && routeCoordinates.length >= 2 && (
          <Marker
            key="route-start-pin"
            coordinate={routeEndpoints.start}
            title="Início da Rota"
            description="Ponto de partida oficial da rota"
            zIndex={isStartSelected ? 1200 : 800}
            anchor={{ x: 0.5, y: 1.0 }}
            onPress={() => onSelectActor('route-start')}
            accessibilityRole="button"
            accessibilityLabel={routeStartA11y}
            accessibilityState={{ selected: isStartSelected }}
          >
            <View style={[styles.startPinContainer, isStartSelected && { transform: [{ scale: 1.15 }] }]}>
              <View style={[styles.startPinHead, isStartSelected && { borderWidth: 2.5, borderColor: '#FFFFFF' }]}>
                <Ionicons name="play" size={13} color="#FFFFFF" style={{ marginLeft: 2 }} />
              </View>
              <View style={styles.startPinPoint} />
            </View>
          </Marker>
        )}

        {/* Marcador de Destino Especial da Rota (Fim) */}
        {routeEndpoints.destination && routeCoordinates.length >= 2 && (
          <Marker
            key="route-destination-pin"
            coordinate={routeEndpoints.destination}
            title="Destino da Rota"
            description="Destino final da rota"
            zIndex={isDestinationSelected ? 1300 : 850}
            anchor={{ x: 0.5, y: 1.0 }}
            onPress={() => onSelectActor('route-destination')}
            accessibilityRole="button"
            accessibilityLabel={routeDestinationA11y}
            accessibilityState={{ selected: isDestinationSelected }}
          >
            <View style={[styles.destinationPinContainer, isDestinationSelected && { transform: [{ scale: 1.15 }] }]}>
              <View style={[styles.destinationPinHead, isDestinationSelected && { borderWidth: 3, borderColor: '#FFFFFF' }]}>
                <Ionicons name="flag" size={18} color="#FFFFFF" />
              </View>
              <View style={styles.destinationPinPoint} />
            </View>
          </Marker>
        )}

        {renderableItems.map((item) => {
          const coordinate = getItemCoordinate(item);
          if (!coordinate) return null;
          const itemId = getItemId(item);
          const selected = itemId === selectedActorId;
          const categoryLabel = getItemCategoryLabel(item);
          const color = getItemPinColor(item);
          const icon = getCategoryIonicons(getItemPinIcon(item));
          const a11yLabel = getItemAccessibilityLabel(item, selected);
          const actorSummary = actorSummariesById.get(itemId);
          if (!color || !icon) return null;

          if (selected && pinCardVariant !== 'none') {
            const photoUrl = actorSummary?.cover_media?.derivatives?.card ||
              actorSummary?.cover_media?.url ||
              actorSummary?.cover_image_url;

            return (
              <Marker
                key={itemId}
                coordinate={coordinate}
                zIndex={1000}
                anchor={{ x: 0.5, y: 1.0 }}
                onPress={() => onSelectActor(itemId)}
                accessibilityRole="button"
                accessibilityLabel={a11yLabel}
                accessibilityState={{ selected: true }}
              >
                <SelectedPinCard
                  actorId={itemId}
                  name={item.name}
                  categorySlug={'category_slug' in item ? item.category_slug : undefined}
                  categoryLabel={categoryLabel}
                  variant={pinCardVariant}
                  googleRating={actorSummary?.google_rating}
                  ratingCount={actorSummary?.rating_count}
                  photoUrl={photoUrl}
                  onPressAction={() => onSelectActor(itemId)}
                />
              </Marker>
            );
          }

          const isHighlightedNative = selected && pinCardVariant === 'none';

          return (
            <Marker
              key={itemId}
              coordinate={coordinate}
              title={item.name}
              description={`Categoria: ${categoryLabel}`}
              zIndex={isHighlightedNative ? 1000 : 1}
              anchor={{ x: 0.5, y: 1.0 }}
              onPress={() => onSelectActor(itemId)}
              accessibilityRole="button"
              accessibilityLabel={a11yLabel}
              accessibilityHint={`Categoria: ${categoryLabel}. Toque para selecionar.`}
              accessibilityState={{ selected: isHighlightedNative }}
            >
              <View style={[styles.teardropContainer, isHighlightedNative && { transform: [{ scale: 1.18 }] }]}>
                <View style={[styles.teardropHead, { backgroundColor: color }, isHighlightedNative && { borderWidth: 2.5, borderColor: '#FFFFFF' }]}>
                  <Ionicons name={icon} size={isHighlightedNative ? 20 : 18} color="#FFFFFF" />
                </View>
                <View style={[styles.teardropPoint, { borderTopColor: color }]} />
              </View>
            </Marker>
          );
        })}

        {userLocation && (
          <Marker
            coordinate={userLocation}
            title={userLocationLabel || 'Sua Localização Atual'}
            description={userLocationA11y}
            pinColor={USER_LOCATION_PIN_COLOR}
            zIndex={1500}
            accessibilityRole="image"
            accessibilityLabel={userLocationA11y}
          />
        )}

        {selectedCoordinate && (
          <Marker
            coordinate={selectedCoordinate}
            title={selectionPinLabel || 'Ponto de Partida Escolhido'}
            description={selectionPinA11y}
            pinColor={SELECTION_PIN_COLOR}
            draggable
            zIndex={2000}
            onDragEnd={(e) => {
              if (onSelectCoordinate) {
                onSelectCoordinate(e.nativeEvent.coordinate);
              }
            }}
            accessibilityRole="button"
            accessibilityLabel={selectionPinA11y}
            accessibilityHint="Ponto de partida selecionado no mapa. Arraste para reposicionar."
          />
        )}
      </MapView>

      {showControls && (
        <MapControls
          onZoomIn={() => void changeZoom(1)}
          onZoomOut={() => void changeZoom(-1)}
          onRecenter={recenter}
          canZoomIn={zoomLevel < MAX_ZOOM}
          canZoomOut={zoomLevel > MIN_ZOOM}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  startPinContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 38,
    filter: 'drop-shadow(0px 3px 6px rgba(0, 0, 0, 0.3))' as any,
  },
  startPinHead: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: ROUTE_START_PIN_COLOR,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    zIndex: 2,
  },
  startPinPoint: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: ROUTE_START_PIN_COLOR,
    marginTop: -3,
    zIndex: 1,
  },
  destinationPinContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 44,
    height: 52,
    filter: 'drop-shadow(0px 4px 8px rgba(220, 38, 38, 0.45))' as any,
  },
  destinationPinHead: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: ROUTE_DESTINATION_PIN_COLOR,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    zIndex: 2,
  },
  destinationPinPoint: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 11,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: ROUTE_DESTINATION_PIN_COLOR,
    marginTop: -4,
    zIndex: 1,
  },
  teardropContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 38,
    height: 46,
    filter: 'drop-shadow(0px 3px 6px rgba(0, 0, 0, 0.3))' as any,
  },
  teardropHead: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    zIndex: 2,
  },
  teardropPoint: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 7,
    borderRightWidth: 7,
    borderTopWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -4,
    zIndex: 1,
  },
  contractPin: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  contractPinSelected: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 4,
    borderColor: '#111827',
  },
  clusterPin: {
    minWidth: 46,
    height: 46,
    paddingHorizontal: 8,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    ...theme.shadows.card,
  },
  clusterCountText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  container: {
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: theme.colors.surfaceContainerLow,
  },
});
