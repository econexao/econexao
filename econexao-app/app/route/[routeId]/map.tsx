import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AccessibilityInfo, Image, Modal, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';

import { AppHeader } from '../../../src/components/common/AppHeader';
import { Badge } from '../../../src/components/common/Badge';
import { CategoryFilters } from '../../../src/components/catalog/CategoryFilters';
import { MapAdapter } from '../../../src/components/map/MapAdapter';
import { GooglePlacePhoto } from '../../../src/components/common/GooglePlacePhoto';
import { EmptyStateView, ErrorStateView, LoadingView } from '../../../src/components/common/UIStateViews';
import { useRouteActorsQuery, useRouteMapQuery } from '../../../src/hooks/queries';
import { theme } from '../../../src/theme/theme';
import { makeAccessibleButton, setAccessibilityFocusSafely } from '../../../src/utils/accessibility';
import {
  filterPinsByModeAndCategory,
  formatCoordinateDisplay,
  getBoundsCoordinates,
  isContractPinColor,
  isContractPinIcon,
  isCoordinateWithinBounds,
} from '../../../src/components/map/MapAdapter.helpers';
import { apiClient } from '../../../src/api/client';
import { queryKeys } from '../../../src/api/queryKeys';
import { CHOOSE_ON_MAP_ORIGIN_ID } from '../../../src/components/routes/OriginSelector';
import { DynamicLocationConsentModal } from '../../../src/components/routes/DynamicLocationConsentModal';
import { GoogleRoutesMapNotice } from '../../../src/components/routes/GoogleRoutesMapNotice';
import { hasValidLocationConsent } from '../../../src/auth/locationConsent';
import { useCurrentLocation } from '../../../src/hooks/useCurrentLocation';
import { useAppContext } from '../../../src/state/useAppContext';
import type { MapPin, MapLegendItem } from '../../../src/api/types';
import type { MapCoordinate, MapViewMode } from '../../../src/components/map/MapAdapter.types';

const AccessibleMapControl = ({
  children,
  style,
  onPress,
  label,
  hint,
  selected,
  disabled = false,
}: {
  children: React.ReactNode;
  style: unknown;
  onPress: () => void;
  label: string;
  hint?: string;
  selected?: boolean;
  disabled?: boolean;
}) => {
  if (Platform.OS === 'web') {
    return React.createElement(
      'button',
      {
        type: 'button',
        style: StyleSheet.flatten(style as never),
        onClick: disabled ? undefined : onPress,
        disabled,
        'aria-label': label,
        'aria-pressed': selected,
        title: hint,
      },
      children
    );
  }

  return (
    <TouchableOpacity
      style={style as never}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={hint}
      accessibilityState={{ selected, disabled }}
    >
      {children}
    </TouchableOpacity>
  );
};

export default function MapScreen() {
  const router = useRouter();
  const { state: appState } = useAppContext();
  const isDynamicRoutingEnabled = Boolean(appState?.featureFlags?.dynamicRouting);

  let queryClient: ReturnType<typeof useQueryClient> | undefined;
  try {
    queryClient = useQueryClient();
  } catch {
    queryClient = undefined;
  }

  const {
    routeId = '',
    originId,
    actorId: initialActorId,
    mode: initialMode,
    viewMode: initialViewMode,
    category: initialCategory,
    q: initialQuery,
  } = useLocalSearchParams<{
    routeId: string;
    originId?: string;
    actorId?: string;
    mode?: string;
    viewMode?: MapViewMode;
    category?: string;
    q?: string;
  }>();

  const fallbackRoute = routeId ? `/route/${encodeURIComponent(routeId)}` : '/(tabs)/(routes)';
  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace(fallbackRoute as any);
    }
  };

  const isSelectionModeInitial = isDynamicRoutingEnabled && initialMode === 'select-origin';
  const [isSelectionMode, setIsSelectionMode] = useState<boolean>(isSelectionModeInitial);
  const [selectedCoordinate, setSelectedCoordinate] = useState<MapCoordinate | null>(null);
  const [isConfirmingSelection, setIsConfirmingSelection] = useState<boolean>(false);
  const [showConsentModal, setShowConsentModal] = useState<boolean>(false);
  const [pendingConsentAction, setPendingConsentAction] = useState<'selection' | 'locate' | null>(null);
  const [locationFeedback, setLocationFeedback] = useState<string | null>(null);
  const [showBrowserPermissionInstructions, setShowBrowserPermissionInstructions] = useState(false);

  const [userLocation, setUserLocation] = useState<MapCoordinate | null>(null);
  const { requestLocation, resetLocation, status: locationStatus } = useCurrentLocation();
  const isLocatingUser = locationStatus === 'requesting';

  const [viewMode, setViewMode] = useState<MapViewMode>(initialViewMode === 'city' ? 'city' : 'route');
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory?.trim() || '');
  const [selectedActorId, setSelectedActorId] = useState<string | undefined>(initialActorId);
  const mapRegionRef = useRef<React.ElementRef<typeof View>>(null);
  const closeSheetButtonRef = useRef<React.ElementRef<typeof TouchableOpacity>>(null);
  const actorSheetWasOpenRef = useRef(false);

  const moveAccessibilityFocus = (target: any) => {
    setAccessibilityFocusSafely(target);
  };

  const closeActorSheet = () => {
    setSelectedActorId(undefined);
  };

  useEffect(() => {
    if (!isDynamicRoutingEnabled && isSelectionMode) {
      setIsSelectionMode(false);
      setSelectedCoordinate(null);
    }
  }, [isDynamicRoutingEnabled, isSelectionMode]);

  const mapQuery = useRouteMapQuery(routeId, {
    origin_id: originId,
  });
  const actorsQuery = useRouteActorsQuery(routeId, {
    origin_id: originId,
    category: selectedCategory || undefined,
  });

  // Check for ephemeral preview data passed via memory cache (when expanded from dynamic preview)
  const ephemeralData = React.useMemo(() => {
    if (!isDynamicRoutingEnabled || !queryClient || isSelectionMode) return null;
    return queryClient.getQueryData<{
      previewData: import('../../../src/api/types').RoutePreviewData;
      originType: string;
    }>(queryKeys.routes.ephemeralPreview(routeId));
  }, [isDynamicRoutingEnabled, queryClient, routeId, isSelectionMode]);

  // Sync initial actorId if passed via route params
  useEffect(() => {
    if (initialActorId) {
      setSelectedActorId(initialActorId);
    }
  }, [initialActorId]);

  useEffect(() => {
    if (selectedActorId) {
      actorSheetWasOpenRef.current = true;
      return;
    }

    if (actorSheetWasOpenRef.current) {
      actorSheetWasOpenRef.current = false;
      moveAccessibilityFocus(mapRegionRef);
    }
  }, [selectedActorId]);

  const handleSelectMapCoordinate = (coord: MapCoordinate) => {
    if (!isDynamicRoutingEnabled) return;
    setSelectedCoordinate(coord);
  };

  const handleCancelSelection = () => {
    setSelectedCoordinate(null);
    setIsSelectionMode(false);
    if (isSelectionModeInitial) {
      router.back();
    }
  };

  const executeRoutePreview = async (coord: MapCoordinate) => {
    setIsConfirmingSelection(true);
    setLocationFeedback(null);
    try {
      const response = await apiClient.previewRoute(routeId, {
        latitude: coord.latitude,
        longitude: coord.longitude,
        travel_mode: 'DRIVE',
      });
      // Transfer ephemeral preview data via memory cache without exposing coordinates in URL
      if (queryClient) {
        queryClient.setQueryData(queryKeys.routes.ephemeralPreview(routeId), {
          previewData: response.data,
          originType: CHOOSE_ON_MAP_ORIGIN_ID,
        });
      }
      // Navigate back to detail screen
      router.back();
    } catch {
      setLocationFeedback('Não foi possível calcular o trajeto a partir deste ponto. A rota e a origem permanecem inalteradas. Tente outro ponto no mapa.');
    } finally {
      setIsConfirmingSelection(false);
    }
  };

  const executeLocateUser = async () => {
    setLocationFeedback(null);
    setShowBrowserPermissionInstructions(false);
    try {
      AccessibilityInfo.announceForAccessibility('Obtendo sua localização atual via GPS...');
      const result = await requestLocation();
      if (result.success && result.coords) {
        const coords: MapCoordinate = {
          latitude: result.coords.latitude,
          longitude: result.coords.longitude,
        };
        setUserLocation(coords);

        const routeBounds = ephemeralData?.previewData?.bounds ?? mapQuery.data?.bounds;
        const isInside = isCoordinateWithinBounds(coords, routeBounds);

        if (isInside) {
          AccessibilityInfo.announceForAccessibility('Sua localização foi exibida no mapa da rota.');
        } else {
          const msg = 'Sua localização atual está fora da região desta rota. A posição foi marcada sem alterar o trajeto ou a origem oficial.';
          AccessibilityInfo.announceForAccessibility(msg);
          setLocationFeedback(msg);
        }
      } else {
        const msg = result.errorMessage || 'Não foi possível obter sua localização atual.';
        AccessibilityInfo.announceForAccessibility(msg);
        setLocationFeedback(
          Platform.OS === 'web'
            ? `${msg} Verifique a permissão de localização deste site e tente novamente. A rota e a origem permanecem inalteradas.`
            : `${msg} A rota e a origem permanecem inalteradas. Tente novamente quando estiver pronto.`
        );
        setShowBrowserPermissionInstructions(Platform.OS === 'web');
      }
    } catch {
      const msg = 'Ocorreu um erro ao acessar a localização. A rota e a origem permanecem inalteradas. Tente novamente.';
      AccessibilityInfo.announceForAccessibility(msg);
      setLocationFeedback(msg);
      setShowBrowserPermissionInstructions(false);
    }
  };

  const handleLocateUser = async () => {
    if (isLocatingUser) return;
    const hasConsent = await hasValidLocationConsent();
    if (!hasConsent) {
      setPendingConsentAction('locate');
      setShowConsentModal(true);
      return;
    }
    await executeLocateUser();
  };

  const handleConfirmSelection = async () => {
    if (!isDynamicRoutingEnabled || !selectedCoordinate || isConfirmingSelection) return;
    const hasConsent = await hasValidLocationConsent();
    if (!hasConsent) {
      setPendingConsentAction('selection');
      setShowConsentModal(true);
      return;
    }
    await executeRoutePreview(selectedCoordinate);
  };

  const handleConsentSuccess = async () => {
    setShowConsentModal(false);
    const action = pendingConsentAction;
    setPendingConsentAction(null);
    if (action === 'selection' && selectedCoordinate) {
      await executeRoutePreview(selectedCoordinate);
    } else if (action === 'locate') {
      await executeLocateUser();
    }
  };

  const handleConsentCancel = () => {
    setShowConsentModal(false);
    const action = pendingConsentAction;
    setPendingConsentAction(null);
    if (action === 'selection') {
      handleCancelSelection();
    }
  };

  const [isProlongedLoading, setIsProlongedLoading] = useState<boolean>(false);

  useEffect(() => {
    if (mapQuery.isPending && !ephemeralData?.previewData) {
      const timer = setTimeout(() => {
        setIsProlongedLoading(true);
      }, 4000);
      return () => clearTimeout(timer);
    } else if (isProlongedLoading) {
      setIsProlongedLoading(false);
    }
  }, [mapQuery.isPending, ephemeralData?.previewData, isProlongedLoading]);

  if (mapQuery.isPending && !ephemeralData?.previewData) {
    const loadingMessage = isProlongedLoading
      ? 'Servidor de staging iniciando; isso pode levar alguns segundos.'
      : 'Carregando mapa da rota...';
    return (
      <View style={styles.container}>
        <AppHeader
          showBack
          fallbackHref={fallbackRoute}
          onBackPress={handleBack}
          title="Mapa da Rota"
        />
        <LoadingView message={loadingMessage} />
      </View>
    );
  }

  if (mapQuery.isError && !ephemeralData?.previewData) {
    const errorCode = (mapQuery.error as { code?: string } | null)?.code;
    const errorCopy = errorCode === 'OFFLINE'
      ? {
          title: 'Mapa indisponível offline',
          message: 'Reconecte-se para atualizar os pontos e tente novamente.',
        }
      : errorCode === 'TIMEOUT'
      ? {
          title: 'O mapa demorou para responder',
          message: 'A conexão pode estar instável ou o servidor demorou para responder. Tente carregar novamente.',
        }
      : {
          title: 'Erro ao carregar mapa',
          message: 'Não foi possível carregar os dados geoespaciais do mapa.',
        };
    return (
      <View style={styles.container}>
        <AppHeader
          showBack
          fallbackHref={fallbackRoute}
          onBackPress={handleBack}
          title="Mapa da Rota"
        />
        <ErrorStateView
          title={errorCopy.title}
          message={errorCopy.message}
          onRetry={() => void mapQuery.refetch()}
        />
      </View>
    );
  }

  if (!mapQuery.data && !ephemeralData?.previewData) {
    return (
      <View style={styles.container}>
        <AppHeader
          showBack
          fallbackHref={fallbackRoute}
          onBackPress={handleBack}
          title="Mapa da Rota"
        />
        <EmptyStateView
          title="Mapa não disponível"
          message="Não há dados de mapa disponíveis para esta origem."
          onReset={handleBack}
          resetLabel="Voltar"
        />
      </View>
    );
  }

  const isGoogleRoutesPreview = ephemeralData?.previewData.provider === 'google_routes';
  const mapPayload: import('../../../src/api/types').RouteMapPayload = ephemeralData?.previewData
    ? {
        route_id: routeId,
        selected_origin_id: undefined,
        bounds: ephemeralData.previewData.bounds,
        city_bounds: ephemeralData.previewData.city_bounds,
        pins: ephemeralData.previewData.pins ?? [],
        legend: ephemeralData.previewData.legend ?? [],
        geometry: {
          id: ephemeralData.originType || 'dynamic_preview',
          route_origin_id: ephemeralData.originType || 'dynamic_preview',
          provider: ephemeralData.previewData.provider || 'dynamic_preview',
          geojson: ephemeralData.previewData.geojson,
          encoded_polyline: ephemeralData.previewData.encoded_polyline ?? null,
          distance_m: ephemeralData.previewData.distance_m,
          duration_s: ephemeralData.previewData.duration_s,
        },
      }
    : mapQuery.data!;
  const allPins = mapPayload.pins;
  const legend = [...mapPayload.legend].sort((a, b) => a.sort_order - b.sort_order);
  const legendBySlug = new Map(legend.map((item) => [item.category_slug, item]));
  const hasInvalidMetadata =
    mapPayload.route_id !== routeId ||
    Boolean(originId && mapPayload.selected_origin_id && mapPayload.selected_origin_id !== originId) ||
    getBoundsCoordinates(mapPayload.bounds).length !== 2 ||
    allPins.length > 200 ||
    legend.some((item) =>
      !item.category_slug || !item.label || !isContractPinColor(item.color) ||
      !isContractPinIcon(item.icon) || !Number.isInteger(item.count) || item.count < 0
    ) ||
    allPins.some((pin) => {
      const item = legendBySlug.get(pin.category_slug);
      return !item || !isContractPinColor(pin.color) || !isContractPinIcon(pin.icon) ||
        pin.color !== item.color || pin.category_label !== item.label;
    }) ||
    legend.some((item) => item.count !== allPins.filter((pin) => pin.category_slug === item.category_slug).length);

  if (hasInvalidMetadata) {
    return (
      <View style={styles.container}>
        <AppHeader
          showBack
          fallbackHref={fallbackRoute}
          onBackPress={handleBack}
          title="Mapa da Rota"
        />
        <ErrorStateView
          title="Mapa temporariamente indisponível"
          message="Os metadados visuais do mapa são inválidos. Tente carregar novamente."
          onRetry={() => void mapQuery.refetch()}
        />
      </View>
    );
  }

  if (!isGoogleRoutesPreview && allPins.length === 0 && legend.every((item) => item.count === 0)) {
    return (
      <View style={styles.container}>
        <AppHeader
          showBack
          fallbackHref={fallbackRoute}
          onBackPress={handleBack}
          title="Mapa da Rota"
        />
        <EmptyStateView
          title="Nenhum ponto nesta rota"
          message="Não há pontos disponíveis para esta origem."
          onReset={() => void mapQuery.refetch()}
          resetLabel="Tentar novamente"
        />
      </View>
    );
  }

  const cityModeAvailable = getBoundsCoordinates(mapPayload.city_bounds).length === 2;
  const displayedViewMode: MapViewMode = viewMode === 'city' && cityModeAvailable ? 'city' : 'route';

  // Filter pins according to viewMode & selectedCategory, keeping the selectedActorId pin visible
  const filteredPins = filterPinsByModeAndCategory(
    allPins,
    displayedViewMode,
    selectedCategory,
    selectedActorId
  );

  // Active bounds based on viewMode: city_bounds with fallback to bounds for city mode, bounds for route mode
  const activeBounds =
    displayedViewMode === 'city'
      ? mapPayload.city_bounds
      : mapPayload.bounds;

  // Find details of selected pin or actor
  const selectedPin: MapPin | undefined = allPins.find(
    (p) => p.actor_id === selectedActorId || p.id === selectedActorId
  );
  const actorsList = Array.isArray(actorsQuery.data)
    ? actorsQuery.data
    : actorsQuery.data?.data || (actorsQuery.data as any)?.items;
  const selectedActorSummary = actorsList?.find(
    (a: any) => a.id === selectedActorId
  );
  const isRouteStart = selectedActorId === 'route-start';
  const isRouteDestination = selectedActorId === 'route-destination';
  const isRouteEndpoint = isRouteStart || isRouteDestination;

  return (
    <View style={styles.container}>
      <AppHeader
        showBack
        fallbackHref={fallbackRoute}
        onBackPress={handleBack}
        title={isSelectionMode ? 'Escolher Origem no Mapa' : 'Mapa da Rota'}
      />

      {/* Selection Mode Instructions Bar */}
      {isSelectionMode ? (
        <View style={styles.selectionModeHeader} accessibilityRole="summary" accessibilityLiveRegion="polite">
          <Ionicons name="location-outline" size={18} color={theme.colors.brandDeep} />
          <Text style={styles.selectionModeHeaderText}>
            {selectedCoordinate
              ? 'Arraste o marcador laranja ou toque no mapa para ajustar.'
              : 'Toque no mapa para posicionar seu ponto de partida.'}
          </Text>
        </View>
      ) : (
        <>
          {/* View Mode Toggle Bar */}
          <View style={styles.modeToggleBar} accessibilityRole="toolbar" accessibilityLabel="Modos de visualização do mapa">
            <AccessibleMapControl
              style={[styles.modeTab, displayedViewMode === 'route' && styles.modeTabActive]}
              onPress={() => setViewMode('route')}
              label="Modo de visualização da rota"
              hint="Filtra a visualização para o corredor e pontos da rota selecionada"
              selected={displayedViewMode === 'route'}
            >
              <Ionicons
                name="trail-sign-outline"
                size={16}
                color={displayedViewMode === 'route' ? theme.colors.surfaceWhite : theme.colors.brandForest}
              />
              <Text
                style={[styles.modeTabText, displayedViewMode === 'route' && styles.modeTabTextActive]}
              >
                Ver rota
              </Text>
            </AccessibleMapControl>

            <AccessibleMapControl
              style={[styles.modeTab, displayedViewMode === 'city' && styles.modeTabActive]}
              onPress={() => cityModeAvailable && setViewMode('city')}
              disabled={!cityModeAvailable}
              label="Modo de visualização da cidade"
              hint="Expande a visualização para todos os pontos e limites da cidade"
              selected={displayedViewMode === 'city'}
            >
              <Ionicons
                name="business-outline"
                size={16}
                color={displayedViewMode === 'city' ? theme.colors.surfaceWhite : theme.colors.brandForest}
              />
              <Text
                style={[styles.modeTabText, displayedViewMode === 'city' && styles.modeTabTextActive]}
              >
                Ver cidade
              </Text>
            </AccessibleMapControl>
          </View>

          {/* Category Filter Chips Bar */}
          <View style={styles.filterBar}>
            <CategoryFilters
              categories={legend}
              selectedCategory={selectedCategory}
              onSelectCategory={(catSlug) => {
                setSelectedCategory(catSlug);
              }}
            />
          </View>
          {!cityModeAvailable && (
            <Text style={styles.modeStatus} accessibilityLiveRegion="polite">
              A visualização da cidade não está disponível para esta origem.
            </Text>
          )}
          <Text style={styles.srStatus} accessibilityLiveRegion="polite">
            {displayedViewMode === 'route' ? 'Visualização da rota' : 'Visualização da cidade'}: {filteredPins.length} pontos visíveis.
          </Text>
        </>
      )}

      {/* Interactive Map Area */}
      <View
        ref={mapRegionRef}
        style={styles.mapWrapper}
        focusable
        tabIndex={-1}
        accessible
        accessibilityRole="summary"
        accessibilityLabel={isSelectionMode ? 'Mapa interativo de seleção de origem' : 'Mapa interativo da rota'}
      >
        {locationFeedback && (
          <View style={styles.locationFeedback} accessibilityRole="alert" accessibilityLiveRegion="assertive">
            <Ionicons name="warning-outline" size={18} color={theme.colors.error} />
            <Text style={styles.locationFeedbackText}>{locationFeedback}</Text>
            {showBrowserPermissionInstructions && (
              <TouchableOpacity
                style={styles.locationFeedbackButton}
                onPress={() => {
                  setLocationFeedback('Para liberar a localização, abra as permissões do site no ícone de cadeado ou ajustes do navegador, permita Localização para este endereço e tente novamente.');
                  setShowBrowserPermissionInstructions(false);
                  AccessibilityInfo.announceForAccessibility('Instruções para liberar a localização no navegador exibidas.');
                }}
                {...makeAccessibleButton('Ver instruções para liberar localização no navegador')}
              >
                <Text style={styles.locationFeedbackAction}>Ver instruções do navegador</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.locationFeedbackButton}
              onPress={() => { setLocationFeedback(null); setShowBrowserPermissionInstructions(false); }}
              {...makeAccessibleButton('Fechar aviso de localização')}
            >
              <Text style={styles.locationFeedbackAction}>Fechar</Text>
            </TouchableOpacity>
          </View>
        )}
        {isGoogleRoutesPreview && ephemeralData?.previewData ? (
          <GoogleRoutesMapNotice
            distanceMeters={ephemeralData.previewData.distance_m}
            durationSeconds={ephemeralData.previewData.duration_s}
          />
        ) : (
          <MapAdapter
            pins={filteredPins}
            geometry={mapPayload.geometry}
            bounds={activeBounds}
            selectedActorId={selectedActorId}
            pinCardVariant="none"
            actorSummaries={actorsList}
            onSelectActor={(id) => {
              if (!isSelectionMode) {
                setSelectedActorId(id);
              }
            }}
            selectionMode={isSelectionMode}
            selectedCoordinate={selectedCoordinate}
            onSelectCoordinate={handleSelectMapCoordinate}
            selectionPinLabel="Ponto de partida escolhido"
            userLocation={userLocation}
            userLocationLabel="Sua localização atual"
            height="100%"
          />
        )}

        {!isSelectionMode && filteredPins.length === 0 && (
          <View style={styles.filteredEmpty} accessibilityLiveRegion="polite">
            <Text style={styles.filteredEmptyText}>Nenhum ponto neste modo ou filtro.</Text>
            <TouchableOpacity
              style={styles.filteredEmptyButton}
              onPress={() => setSelectedCategory('')}
              {...makeAccessibleButton('Limpar filtro do mapa')}
            >
              <Text style={styles.filteredEmptyButtonText}>Limpar filtro</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Floating action button to locate user on map */}
        {!isSelectionMode && (
          <AccessibleMapControl
            style={[styles.locateUserButton, isLocatingUser && styles.locateUserButtonDisabled]}
            onPress={handleLocateUser}
            disabled={isLocatingUser}
            label="Mostrar minha localização no mapa"
            hint="Obtém a sua posição GPS e destaca no mapa sem alterar a rota"
          >
            {isLocatingUser ? (
              <ActivityIndicator size="small" color={theme.colors.brandForest} />
            ) : (
              <Ionicons
                name={userLocation ? 'navigate' : 'navigate-outline'}
                size={18}
                color={userLocation ? '#0284C7' : theme.colors.brandForest}
              />
            )}
            <Text style={[styles.locateUserText, Boolean(userLocation) && styles.locateUserTextActive]}>
              {userLocation ? 'Minha localização' : 'Onde estou?'}
            </Text>
          </AccessibleMapControl>
        )}

        {/* Selection bottom confirm / cancel action bar */}
        {isSelectionMode && selectedCoordinate && (
          <View style={styles.selectionActionBar} accessibilityLiveRegion="polite">
            <View style={styles.selectionCoordInfo}>
              <Ionicons name="pin" size={16} color="#EA580C" />
              <Text style={styles.selectionCoordText}>
                Coordenadas: {formatCoordinateDisplay(selectedCoordinate)}
              </Text>
            </View>
            <View style={styles.selectionActionButtons}>
              <TouchableOpacity
                style={[styles.selectionBtn, styles.selectionCancelBtn]}
                onPress={handleCancelSelection}
                disabled={isConfirmingSelection}
                {...makeAccessibleButton('Cancelar seleção de ponto de partida')}
              >
                <Text style={styles.selectionCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.selectionBtn, styles.selectionConfirmBtn]}
                onPress={handleConfirmSelection}
                disabled={isConfirmingSelection}
                {...makeAccessibleButton('Confirmar ponto de partida escolhido')}
              >
                {isConfirmingSelection ? (
                  <ActivityIndicator size="small" color={theme.colors.surfaceWhite} />
                ) : (
                  <Text style={styles.selectionConfirmText}>Confirmar Ponto de Partida</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Contextual button to return to route mode when in city view */}
        {!isSelectionMode && displayedViewMode === 'city' && !selectedActorId && (
          <AccessibleMapControl
            style={styles.returnToRouteButton}
            onPress={() => setViewMode('route')}
            label="Voltar para a rota"
            hint="Retorna a visualização para o corredor e enquadramento da rota"
          >
            <Ionicons name="arrow-back" size={14} color={theme.colors.brandForest} />
            <Text style={styles.returnToRouteText}>Voltar para a rota</Text>
          </AccessibleMapControl>
        )}

        {/* Floating Route Endpoint (Start / Destination) Detail Card */}
        {!isSelectionMode && isRouteEndpoint && (
          <View
            style={styles.floatingCardContainer}
            accessibilityRole="summary"
            accessibilityLabel={
              isRouteStart
                ? 'Detalhes do ponto de partida da rota'
                : 'Detalhes do destino final da rota'
            }
          >
            <View style={styles.floatingCard}>
              <View style={styles.cardMainRow}>
                <View style={styles.cardPhotoWrapper}>
                  <View
                    style={[
                      styles.cardPhotoFallback,
                      { backgroundColor: isRouteStart ? '#16A34A18' : '#DC262618' },
                    ]}
                  >
                    <Ionicons
                      name={isRouteStart ? 'play' : 'flag'}
                      size={28}
                      color={isRouteStart ? '#16A34A' : '#DC2626'}
                      style={isRouteStart ? { marginLeft: 2 } : undefined}
                    />
                  </View>
                </View>

                <View style={styles.cardInfoColumn}>
                  <View style={styles.cardHeaderRow}>
                    <View style={styles.cardTagWrapper}>
                      <Text
                        style={[
                          styles.cardCategoryTag,
                          { color: isRouteStart ? '#16A34A' : '#DC2626' },
                        ]}
                      >
                        {isRouteStart ? 'INÍCIO DA ROTA' : 'DESTINO DA ROTA'}
                      </Text>
                    </View>

                    <TouchableOpacity
                      ref={closeSheetButtonRef}
                      style={styles.cardCloseBtn}
                      onPress={closeActorSheet}
                      {...makeAccessibleButton(
                        isRouteStart
                          ? 'Fechar detalhes do ponto de partida'
                          : 'Fechar detalhes do destino',
                        'Fecha este card e mantém o mapa interativo'
                      )}
                    >
                      <Ionicons name="close" size={18} color={theme.colors.onSurfaceVariant} />
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.cardTitle} numberOfLines={2} accessibilityRole="header">
                    {isRouteStart ? 'Ponto de Partida' : 'Destino Final'}
                  </Text>

                  <View style={styles.cardMetaRow}>
                    <Ionicons
                      name={isRouteStart ? 'navigate-outline' : 'flag-outline'}
                      size={13}
                      color={isRouteStart ? '#16A34A' : '#DC2626'}
                    />
                    <Text style={styles.cardAddress} numberOfLines={1}>
                      {isRouteStart
                        ? 'Início do percurso oficial desta rota'
                        : 'Ponto de chegada e término do trajeto'}
                    </Text>
                  </View>

                  <View style={styles.cardBadgesRow}>
                    {isRouteStart ? (
                      <View style={styles.cardDistanceBadge}>
                        <Ionicons name="compass-outline" size={11} color="#16A34A" />
                        <Text style={[styles.cardDistanceText, { color: '#16A34A' }]}>
                          0,0 km (Marco zero)
                        </Text>
                      </View>
                    ) : (
                      <>
                        {typeof mapPayload.geometry?.distance_m === 'number' && (
                          <View style={styles.cardDistanceBadge}>
                            <Ionicons
                              name="navigate-outline"
                              size={11}
                              color={theme.colors.brandForest}
                            />
                            <Text style={styles.cardDistanceText}>
                              {(mapPayload.geometry.distance_m / 1000).toFixed(1)} km de extensão
                            </Text>
                          </View>
                        )}
                        {typeof mapPayload.geometry?.duration_s === 'number' && (
                          <View style={styles.cardRatingBadge}>
                            <Ionicons name="time-outline" size={12} color={theme.colors.brandForest} />
                            <Text style={styles.cardRatingText}>
                              ~{Math.round(mapPayload.geometry.duration_s / 60)} min
                            </Text>
                          </View>
                        )}
                      </>
                    )}
                  </View>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Floating Actor Detail Card (Interactive & Non-blocking) */}
        {!isSelectionMode && !isRouteEndpoint && Boolean(selectedActorId) && Boolean(selectedPin || selectedActorSummary) && (
          <View
            style={styles.floatingCardContainer}
            accessibilityRole="summary"
            accessibilityLabel={`Detalhes de ${selectedPin?.name || selectedActorSummary?.name || 'ponto selecionado'}`}
          >
            <View style={styles.floatingCard}>
              {/* Main Content Row: Left Photo + Right Details */}
              <View style={styles.cardMainRow}>
                {/* Left Column: Photo / Thumbnail */}
                <View style={styles.cardPhotoWrapper}>
                  {selectedActorSummary?.cover_media?.derivatives?.card ||
                  selectedActorSummary?.cover_media?.url ||
                  selectedActorSummary?.cover_image_url ? (
                    <Image
                      source={{
                        uri:
                          selectedActorSummary?.cover_media?.derivatives?.card ??
                          selectedActorSummary?.cover_media?.url ??
                          selectedActorSummary?.cover_image_url,
                      }}
                      style={styles.cardPhoto}
                      resizeMode="cover"
                      accessible
                      accessibilityLabel={
                        selectedActorSummary?.cover_media?.alt_text ||
                        `Foto de ${selectedPin?.name || selectedActorSummary?.name}`
                      }
                    />
                  ) : (selectedPin?.actor_id || selectedActorSummary?.id || selectedPin?.id || selectedActorId) ? (
                    <GooglePlacePhoto
                      actorId={
                        (selectedPin?.actor_id ||
                          selectedActorSummary?.id ||
                          selectedPin?.id ||
                          selectedActorId)!
                      }
                      alt={`Foto de ${selectedPin?.name || selectedActorSummary?.name || 'estabelecimento'}`}
                      variant="thumbnail"
                    />
                  ) : (
                    <View style={styles.cardPhotoFallback}>
                      <Ionicons name="location" size={28} color={theme.colors.brandForest} />
                    </View>
                  )}
                </View>

                {/* Right Column: Information & Metadata */}
                <View style={styles.cardInfoColumn}>
                  {/* Category & Badges + Close Button */}
                  <View style={styles.cardHeaderRow}>
                    <View style={styles.cardTagWrapper}>
                      <Text style={styles.cardCategoryTag}>
                        {(selectedPin?.category_label || selectedActorSummary?.category_label || selectedPin?.category_slug || 'Ponto da Rota').toUpperCase()}
                      </Text>
                      {selectedActorSummary?.verification_status === 'verified' && (
                        <Badge type="semturInventory" label="SEMTUR" />
                      )}
                      {selectedActorSummary?.green_badge_status === 'verified' && (
                        <Badge type="greenSeal" label="Selo Verde" />
                      )}
                    </View>

                    <TouchableOpacity
                      ref={closeSheetButtonRef}
                      style={styles.cardCloseBtn}
                      onPress={closeActorSheet}
                      {...makeAccessibleButton(
                        'Fechar detalhes do ponto',
                        'Fecha este card e mantém o mapa interativo'
                      )}
                    >
                      <Ionicons name="close" size={18} color={theme.colors.onSurfaceVariant} />
                    </TouchableOpacity>
                  </View>

                  {/* Title / Name */}
                  <Text style={styles.cardTitle} numberOfLines={2} accessibilityRole="header">
                    {selectedPin?.name || selectedActorSummary?.name}
                  </Text>

                  {/* Address */}
                  {Boolean(selectedActorSummary?.address) && (
                    <View style={styles.cardMetaRow}>
                      <Ionicons name="location-outline" size={13} color={theme.colors.brandForest} />
                      <Text style={styles.cardAddress} numberOfLines={1}>
                        {selectedActorSummary?.address}
                      </Text>
                    </View>
                  )}

                  {/* Rating & Distance Badges Row */}
                  <View style={styles.cardBadgesRow}>
                    {typeof selectedActorSummary?.google_rating === 'number' && Number.isFinite(selectedActorSummary.google_rating) && (
                      <View
                        style={styles.cardRatingBadge}
                        accessibilityRole="text"
                        accessibilityLabel={`Avaliação Google: ${selectedActorSummary.google_rating.toFixed(1)} estrelas`}
                      >
                        <Ionicons name="star" size={12} color="#F59E0B" />
                        <Text style={styles.cardRatingText}>
                          {selectedActorSummary.google_rating.toFixed(1)}
                        </Text>
                      </View>
                    )}

                    {typeof selectedPin?.distance_from_origin_m === 'number' && (
                      <View style={styles.cardDistanceBadge}>
                        <Ionicons name="navigate-outline" size={11} color={theme.colors.brandForest} />
                        <Text style={styles.cardDistanceText}>
                          {(selectedPin.distance_from_origin_m / 1000).toFixed(1)} km da origem
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>

              {/* Loading or Query Error States */}
              {actorsQuery.isFetching && !selectedActorSummary && (
                <ActivityIndicator size="small" style={{ marginVertical: 2 }} accessibilityLabel="Carregando detalhes do ator" />
              )}
              {actorsQuery.isError && !selectedActorSummary && (
                <View accessibilityLiveRegion="polite" style={styles.cardErrorRow}>
                  <Text style={styles.cardErrorText}>Detalhes adicionais indisponíveis.</Text>
                  <TouchableOpacity
                    style={styles.cardRetryBtn}
                    onPress={() => void actorsQuery.refetch()}
                    {...makeAccessibleButton('Tentar carregar detalhes novamente')}
                  >
                    <Text style={styles.cardRetryText}>Tentar novamente</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Action Button: Ver no catálogo */}
              <TouchableOpacity
                style={styles.cardActionBtn}
                onPress={() => {
                  const targetActorId =
                    selectedPin?.actor_id ||
                    selectedPin?.id ||
                    selectedActorSummary?.id ||
                    selectedActorId;
                  if (targetActorId) {
                    closeActorSheet();
                    router.push(
                      `/route/${encodeURIComponent(routeId)}/catalog?${new URLSearchParams({
                        ...(originId ? { originId } : {}),
                        actorId: targetActorId,
                        ...(selectedCategory ? { category: selectedCategory } : {}),
                        ...(initialQuery ? { q: initialQuery } : {}),
                        viewMode: displayedViewMode,
                      }).toString()}`
                    );
                  }
                }}
                {...makeAccessibleButton(
                  `Ver ${selectedPin?.name || selectedActorSummary?.name} no catálogo`,
                  'Abre o catálogo mantendo a origem e o ator selecionados'
                )}
              >
                <Text style={styles.cardActionBtnText}>Ver no catálogo</Text>
                <Ionicons name="chevron-forward" size={16} color={theme.colors.onPrimary} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* LGPD Dynamic Location Consent Gate Modal */}
      {showConsentModal && (
        <DynamicLocationConsentModal
          visible
          onConsentSuccess={handleConsentSuccess}
          onCancelFixedOrigin={handleConsentCancel}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surfaceBackground,
  },
  filterBar: {
    backgroundColor: theme.colors.surfaceWhite,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(117, 155, 113, 0.15)',
    zIndex: 10,
  },
  modeStatus: {
    ...theme.typography.labelSm,
    color: theme.colors.onSurfaceVariant,
    backgroundColor: theme.colors.surfaceWhite,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  srStatus: {
    position: 'absolute',
    width: 1,
    height: 1,
    overflow: 'hidden',
    opacity: 0,
  },
  modeToggleBar: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surfaceWhite,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
    gap: 8,
    zIndex: 11,
  },
  modeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: 'rgba(117, 155, 113, 0.2)',
    minHeight: 44,
  },
  modeTabActive: {
    backgroundColor: theme.colors.brandForest,
    borderColor: theme.colors.brandForest,
  },
  modeTabText: {
    ...theme.typography.labelMd,
    color: theme.colors.brandForest,
    fontWeight: '600',
  },
  modeTabTextActive: {
    color: theme.colors.surfaceWhite,
  },
  returnToRouteButton: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.colors.surfaceWhite,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: theme.radii.full,
    ...theme.shadows.card,
    borderWidth: 1,
    borderColor: theme.colors.brandForest,
    zIndex: 20,
    minHeight: 44,
  },
  returnToRouteText: {
    ...theme.typography.labelSm,
    color: theme.colors.brandForest,
    fontWeight: '700',
  },
  locateUserButton: {
    position: 'absolute',
    top: 12,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.colors.surfaceWhite,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: theme.radii.full,
    ...theme.shadows.card,
    borderWidth: 1,
    borderColor: 'rgba(117, 155, 113, 0.3)',
    zIndex: 20,
    minHeight: 44,
  },
  locateUserButtonDisabled: {
    opacity: 0.7,
  },
  locateUserText: {
    ...theme.typography.labelSm,
    color: theme.colors.brandForest,
    fontWeight: '700',
  },
  locateUserTextActive: {
    color: '#0284C7',
  },
  selectionModeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#FDE68A',
    zIndex: 15,
  },
  selectionModeHeaderText: {
    ...theme.typography.labelSm,
    color: '#92400E',
    fontWeight: '600',
    flex: 1,
  },
  selectionActionBar: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    backgroundColor: theme.colors.surfaceWhite,
    borderRadius: theme.radii.xl,
    padding: 14,
    gap: 10,
    ...theme.shadows.card,
    borderWidth: 1,
    borderColor: 'rgba(234, 88, 12, 0.3)',
    zIndex: 25,
  },
  selectionCoordInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  selectionCoordText: {
    ...theme.typography.labelSm,
    color: theme.colors.brandDeep,
    fontWeight: '600',
  },
  selectionActionButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  selectionBtn: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: theme.radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectionCancelBtn: {
    backgroundColor: theme.colors.surfaceContainerLow,
  },
  selectionCancelText: {
    ...theme.typography.labelMd,
    color: theme.colors.brandDeep,
    fontWeight: '600',
  },
  selectionConfirmBtn: {
    backgroundColor: '#EA580C',
  },
  selectionConfirmText: {
    ...theme.typography.labelMd,
    color: theme.colors.surfaceWhite,
    fontWeight: '700',
  },
  mapWrapper: {
    flex: 1,
    position: 'relative',
  },
  locationFeedback: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    zIndex: 20,
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: 8,
    backgroundColor: theme.colors.errorContainer,
    borderColor: theme.colors.error,
    borderWidth: 1,
    borderRadius: theme.radii.md,
    padding: 10,
    paddingTop: 54,
    paddingLeft: 10,
  },
  locationFeedbackText: {
    ...theme.typography.bodySm,
    color: theme.colors.onSurface,
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
    width: '100%',
  },
  locationFeedbackAction: {
    ...theme.typography.labelSm,
    color: theme.colors.brandDeep,
    fontWeight: '700',
    textDecorationLine: 'underline',
    maxWidth: '100%',
    width: '100%',
    flexShrink: 1,
    alignSelf: 'stretch',
  },
  locationFeedbackButton: {
    width: '100%',
    maxWidth: '100%',
    flexShrink: 1,
  },
  filteredEmpty: {
    position: 'absolute',
    top: 12,
    left: 16,
    right: 16,
    backgroundColor: theme.colors.surfaceWhite,
    borderRadius: theme.radii.md,
    padding: 12,
    alignItems: 'center',
    gap: 8,
    zIndex: 18,
    ...theme.shadows.card,
  },
  filteredEmptyText: {
    ...theme.typography.bodySm,
    color: theme.colors.brandDeep,
  },
  filteredEmptyButton: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderRadius: theme.radii.full,
    borderWidth: 1,
    borderColor: theme.colors.brandForest,
  },
  filteredEmptyButtonText: {
    ...theme.typography.labelMd,
    color: theme.colors.brandForest,
  },
  floatingCardContainer: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    maxWidth: 480,
    alignSelf: 'center',
    zIndex: 30,
  },
  floatingCard: {
    backgroundColor: theme.colors.surfaceWhite,
    borderRadius: 16,
    padding: 12,
    gap: 10,
    ...theme.shadows.card,
    borderWidth: 1,
    borderColor: 'rgba(117, 155, 113, 0.22)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 14,
    elevation: 8,
  },
  cardMainRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 12,
  },
  cardPhotoWrapper: {
    width: 90,
    height: 90,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: theme.colors.surfaceContainerLow,
    flexShrink: 0,
    alignSelf: 'center',
  },
  cardPhoto: {
    width: '100%',
    height: '100%',
  },
  cardPhotoFallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(117, 155, 113, 0.12)',
  },
  cardInfoColumn: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'space-between',
    gap: 3,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  cardTagWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
    flex: 1,
    minWidth: 0,
  },
  cardCategoryTag: {
    ...theme.typography.labelSm,
    backgroundColor: theme.colors.surfaceContainerLow,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: theme.radii.sm,
    color: theme.colors.brandForest,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  cardCloseBtn: {
    width: 28,
    height: 28,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  cardTitle: {
    ...theme.typography.headlineSm,
    color: theme.colors.brandDeep,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 18,
  },
  cardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cardAddress: {
    ...theme.typography.bodySm,
    color: theme.colors.onSurfaceVariant,
    fontSize: 11,
    flex: 1,
  },
  cardBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 2,
  },
  cardRatingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: theme.radii.sm,
  },
  cardRatingText: {
    ...theme.typography.labelSm,
    color: '#92400E',
    fontSize: 11,
    fontWeight: '700',
  },
  cardDistanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  cardDistanceText: {
    ...theme.typography.labelSm,
    color: theme.colors.brandForest,
    fontSize: 11,
    fontWeight: '600',
  },
  cardErrorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  cardErrorText: {
    ...theme.typography.bodySm,
    color: theme.colors.error,
    fontSize: 11,
  },
  cardRetryBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.radii.full,
    borderWidth: 1,
    borderColor: theme.colors.brandForest,
  },
  cardRetryText: {
    ...theme.typography.labelSm,
    color: theme.colors.brandForest,
    fontSize: 11,
    fontWeight: '600',
  },
  cardActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.brandForest,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: theme.radii.full,
    gap: 6,
    minHeight: 44,
  },
  cardActionBtnText: {
    ...theme.typography.labelMd,
    color: theme.colors.onPrimary,
    fontWeight: '700',
    fontSize: 13,
  },
});
