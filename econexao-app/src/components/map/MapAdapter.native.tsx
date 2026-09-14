import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, Polyline, type LatLng, type Region } from 'react-native-maps';

import { theme } from '../../theme/theme';
import { MapControls } from './MapControls';
import { SelectedPinCard } from './SelectedPinCard';
import {
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
    recenter();
  }, [recenter]);

  const changeZoom = useCallback(async (delta: number) => {
    const nextZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoomLevel + delta));
    const camera = await mapRef.current?.getCamera();
    if (!camera) return;
    mapRef.current?.animateCamera({ ...camera, zoom: nextZoom }, { duration: 250 });
    setZoomLevel(nextZoom);
  }, [zoomLevel]);

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

          if (selected) {
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

          return (
            <Marker
              key={itemId}
              coordinate={coordinate}
              title={item.name}
              description={`Categoria: ${categoryLabel}`}
              zIndex={1}
              anchor={{ x: 0.5, y: 1.0 }}
              onPress={() => onSelectActor(itemId)}
              accessibilityRole="button"
              accessibilityLabel={a11yLabel}
              accessibilityHint={`Categoria: ${categoryLabel}. Toque para selecionar.`}
              accessibilityState={{ selected: false }}
            >
              <View style={styles.teardropContainer}>
                <View style={[styles.teardropHead, { backgroundColor: color }]}>
                  <Ionicons name={icon} size={18} color="#FFFFFF" />
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
