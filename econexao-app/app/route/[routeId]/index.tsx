import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, Alert, ActivityIndicator, AccessibilityInfo, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { AppHeader } from '../../../src/components/common/AppHeader';
import { EmptyStateView, ErrorStateView, LoadingView } from '../../../src/components/common/UIStateViews';
import { LocalCatalogPreview } from '../../../src/components/routes/LocalCatalogPreview';
import { OriginSelector, MY_LOCATION_ORIGIN_ID, CHOOSE_ON_MAP_ORIGIN_ID } from '../../../src/components/routes/OriginSelector';
import { RouteMapPreview } from '../../../src/components/routes/RouteMapPreview';
import { RouteGallery } from '../../../src/components/routes/RouteGallery';
import { MotionBlock } from '../../../src/components/common/MotionBlock';
import { GoogleRoutesMapNotice } from '../../../src/components/routes/GoogleRoutesMapNotice';
import {
  getPindobalCoverImage,
  getPedralCoverImage,
  getRouteCoverImage,
  getRouteDisplayName,
  getRouteDescription,
  getRouteCity,
} from '../../../src/components/routes/routeCoverImage';
import { useRouteAlertsQuery, useRouteDetailQuery } from '../../../src/hooks/queries';
import { theme, useAppTheme } from '../../../src/theme/theme';

import { makeAccessibleButton } from '../../../src/utils/accessibility';
import { apiClient, ApiClientError } from '../../../src/api/client';
import { queryKeys } from '../../../src/api/queryKeys';
import { AuthContext } from '../../../src/auth/AuthProvider';
import { useAppContext } from '../../../src/state/useAppContext';
import type { RoutePreviewData, RouteGeometry, MapBounds } from '../../../src/api/types';
import type { MapCoordinate } from '../../../src/components/map/MapAdapter.types';
import type { LocationCoordinates } from '../../../src/hooks/useCurrentLocation';

const routePath = (
  routeId: string,
  destination: 'map' | 'catalog',
  originId?: string,
  actorId?: string,
  category?: string,
  mode?: string
) => {
  const query = new URLSearchParams();
  if (originId && originId !== MY_LOCATION_ORIGIN_ID && originId !== CHOOSE_ON_MAP_ORIGIN_ID) {
    query.set('originId', originId);
  }
  if (actorId) query.set('actorId', actorId);
  if (category) query.set('category', category);
  if (mode) query.set('mode', mode);
  const suffix = query.toString();
  return `/route/${encodeURIComponent(routeId)}/${destination}${suffix ? `?${suffix}` : ''}`;
};

export default function RouteDetailScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const { state: appState } = useAppContext();
  const isDynamicRoutingEnabled = Boolean(appState?.featureFlags?.dynamicRouting);
  let queryClient: ReturnType<typeof useQueryClient> | undefined;
  try {
    queryClient = useQueryClient();
  } catch {
    queryClient = undefined;
  }
  const auth = React.useContext(AuthContext);
  const user = auth?.user;
  const { routeId = '', originId: initialOriginId, actorId } = useLocalSearchParams<{
    routeId: string;
    originId?: string;
    actorId?: string;
  }>();

  const [isStartingTrip, setIsStartingTrip] = useState(false);
  const detail = useRouteDetailQuery(routeId);

  const [originId, setOriginId] = useState<string | undefined>(initialOriginId);
  const [previewData, setPreviewData] = useState<RoutePreviewData | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const lastValidOriginIdRef = React.useRef<string | undefined>(initialOriginId);

  const isCustomLocation = isDynamicRoutingEnabled && (originId === MY_LOCATION_ORIGIN_ID || originId === CHOOSE_ON_MAP_ORIGIN_ID || Boolean(previewData));
  const requestedOriginExists = detail.data?.origins.some((origin) => origin.id === originId);
  const defaultOrigin = detail.data?.origins.find((o) => {
    const code = ('code' in o && o.code ? o.code : o.id || '').toLowerCase();
    const name = (o.name || '').toLowerCase();
    return code.includes('rodoviaria') || name.includes('rodoviária') || name.includes('rodoviaria');
  }) || detail.data?.origins[0];
  const effectiveOrigin = isCustomLocation ? originId : (requestedOriginExists ? originId : defaultOrigin?.id);

  useEffect(() => {
    setOriginId(initialOriginId);
    setPreviewData(null);
    if (initialOriginId && initialOriginId !== MY_LOCATION_ORIGIN_ID && initialOriginId !== CHOOSE_ON_MAP_ORIGIN_ID) {
      lastValidOriginIdRef.current = initialOriginId;
    }

    if (isDynamicRoutingEnabled && queryClient && routeId) {
      const ephemeralKey = queryKeys.routes.ephemeralPreview(routeId);
      const cachedData = queryClient.getQueryData<{
        previewData: RoutePreviewData;
        originType: string;
      }>(ephemeralKey);

      if (cachedData?.previewData) {
        setPreviewData(cachedData.previewData);
        setOriginId(cachedData.originType || CHOOSE_ON_MAP_ORIGIN_ID);
        AccessibilityInfo.announceForAccessibility('Trajeto sugerido a partir do ponto escolhido no mapa carregado.');
        // Consume/clear ephemeral preview so subsequent back/focus operations don't re-trigger
        queryClient.removeQueries({ queryKey: ephemeralKey });
      }
    }
  }, [initialOriginId, routeId, isDynamicRoutingEnabled]);

  const alerts = useRouteAlertsQuery(routeId);

  const handleSelectOrigin = (newOriginId: string) => {
    setOriginId(newOriginId);
    if (newOriginId !== MY_LOCATION_ORIGIN_ID && newOriginId !== CHOOSE_ON_MAP_ORIGIN_ID) {
      lastValidOriginIdRef.current = newOriginId;
      setPreviewData(null);
      if (queryClient) {
        queryClient.removeQueries({ queryKey: queryKeys.routes.ephemeralPreview(routeId) });
      }
    }
  };

  const handleSelectCoordinate = async (coords: MapCoordinate, originType: string = CHOOSE_ON_MAP_ORIGIN_ID) => {
    if (isPreviewLoading || !isDynamicRoutingEnabled) return;
    setIsPreviewLoading(true);
    try {
      const response = await apiClient.previewRoute(routeId, {
        latitude: coords.latitude,
        longitude: coords.longitude,
        travel_mode: 'DRIVE',
      });
      setPreviewData(response.data);
      setOriginId(originType);
      AccessibilityInfo.announceForAccessibility('Trajeto sugerido a partir do ponto escolhido carregado com sucesso.');
    } catch {
      // Fallback to previous valid origin or default origin (Rodoviária)
      const fallbackOrigin = lastValidOriginIdRef.current || defaultOrigin?.id;
      setOriginId(fallbackOrigin);
      setPreviewData(null);
      AccessibilityInfo.announceForAccessibility('Não foi possível calcular o trajeto sugerido.');
      Alert.alert(
        'Trajeto Sugerido Indisponível',
        'Não conseguimos calcular o trajeto sugerido a partir deste ponto. Exibindo rota pela origem padrão.'
      );
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const handleSelectCurrentLocation = async (coords: LocationCoordinates) => {
    if (!isDynamicRoutingEnabled) return;
    await handleSelectCoordinate(coords, MY_LOCATION_ORIGIN_ID);
  };

  const handleStartSelectOnMap = () => {
    if (!isDynamicRoutingEnabled) return;
    router.push(routePath(routeId, 'map', isCustomLocation ? undefined : effectiveOrigin, actorId, undefined, 'select-origin'));
  };

  const handleStartTrip = async () => {
    try {
      setIsStartingTrip(true);
      await apiClient.createTrip(routeId);
      if (queryClient && user?.id) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.myTrips(user.id) });
      }

      AccessibilityInfo.announceForAccessibility('Viagem iniciada com sucesso. Bom passeio sustentável!');
      Alert.alert('Viagem Iniciada', 'Sua viagem foi registrada no histórico do seu perfil.');
    } catch {
      AccessibilityInfo.announceForAccessibility('Erro ao iniciar viagem.');
      Alert.alert('Erro', 'Não foi possível registrar o início da viagem no momento.');
    } finally {
      setIsStartingTrip(false);
    }
  };

  if (detail.isPending) {
    return <LoadingView message="Carregando detalhes da rota..." />;
  }

  const isNotFound = detail.error instanceof ApiClientError && detail.error.status === 404;

  if (isNotFound || (!detail.isPending && !detail.isError && !detail.data)) {
    return (
      <View style={styles.container}>
        <AppHeader showBack onBackPress={() => router.back()} title="Detalhes da Rota" />
        <EmptyStateView
          title="Rota não encontrada"
          message="A rota solicitada não existe ou pode estar temporariamente indisponível."
          onReset={() => void detail.refetch()}
          resetLabel="Tentar novamente"
        />
        <TouchableOpacity
          style={styles.notFoundBackButton}
          onPress={() => router.back()}
          {...makeAccessibleButton('Voltar para a lista')}
        >
          <Text style={styles.notFoundBackText}>Voltar para a lista</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/(routes)');
    }
  };

  if (detail.isError) {
    return (
      <View style={styles.container}>
        <AppHeader
          showBack
          fallbackHref="/(tabs)/(routes)"
          onBackPress={handleBack}
          title="Detalhes da Rota"
        />
        <ErrorStateView
          title="Erro ao carregar rota"
          message="Não foi possível carregar as informações desta rota."
          onRetry={() => void detail.refetch()}
        />
      </View>
    );
  }

  const route = detail.data;
  const routeHeroImage = getPindobalCoverImage(route) || getPedralCoverImage(route) || getRouteCoverImage(route);
  const isGoogleRoutesPreview = previewData?.provider === 'google_routes';

  const customGeometry: RouteGeometry | null = previewData && !isGoogleRoutesPreview
    ? {
        id: originId || MY_LOCATION_ORIGIN_ID,
        route_origin_id: originId || MY_LOCATION_ORIGIN_ID,
        provider: previewData.provider || 'dynamic_preview',
        geojson: previewData.geojson,
        encoded_polyline: previewData.encoded_polyline ?? null,
        distance_m: previewData.distance_m,
        duration_s: previewData.duration_s,
      }
    : null;

  const customBounds: MapBounds | null = previewData?.bounds ?? null;
  const originSelector = route.origins && route.origins.length > 0 ? (
    <OriginSelector
      origins={route.origins}
      selectedOriginId={effectiveOrigin}
      onSelectOrigin={handleSelectOrigin}
      onSelectCurrentLocation={handleSelectCurrentLocation}
      onStartSelectOnMap={handleStartSelectOnMap}
      isLoadingLocation={isPreviewLoading}
      enableDynamicRouting={isDynamicRoutingEnabled}
    />
  ) : null;

  const displayTitle = route ? getRouteDisplayName(route) : '';
  const routeDescription = route ? getRouteDescription(route) : '';

  return (
    <View style={styles.container}>
      <AppHeader
        showBack
        fallbackHref="/(tabs)/(routes)"
        onBackPress={handleBack}
        title={displayTitle}
      />

      <ScrollView contentContainerStyle={styles.content}>
        <MotionBlock staggerIndex={0}>
        {/* Header Hero Section */}
        {routeHeroImage ? (
          <View style={styles.pindobalHeroStack}>
            <View style={[styles.heroSection, styles.heroSectionWithImage]}>
              <Image
                source={routeHeroImage}
                style={styles.heroImage}
                resizeMode="cover"
                accessible={false}
              />
              <View style={styles.heroOverlay}>
                <Text style={[styles.title, styles.titleOnImage]}>{displayTitle}</Text>
                <Text style={[styles.subtitle, styles.subtitleOnImage]}>
                  {getRouteCity(route)}, {route.state_code}
                  {route.is_verified && ' • Rota Verificada'}
                </Text>
              </View>
            </View>
            {originSelector ? <View style={styles.originSelectorOverlay}>{originSelector}</View> : null}
          </View>
        ) : (
          <>
            <View style={styles.heroSection}>
              <Text style={styles.title}>{displayTitle}</Text>
              <Text style={styles.subtitle}>
                {getRouteCity(route)}, {route.state_code}
                {route.is_verified && ' • Rota Verificada'}
              </Text>
            </View>
            {originSelector}
          </>
        )}

        <RouteGallery route={route} />

        {/* Breve Descrição sobre o Local */}
        {routeDescription ? (
          <View style={styles.descriptionCard} accessible accessibilityLabel="Sobre o local">
            <View style={styles.descriptionHeaderRow}>
              <Ionicons name="information-circle-outline" size={18} color={theme.colors.brandForest} />
              <Text style={styles.descriptionHeading}>Sobre o local</Text>
            </View>
            <Text style={styles.descriptionBody}>{routeDescription}</Text>
          </View>
        ) : null}


        {/* Dynamic preview notice banner */}
        {isCustomLocation && (
          <View style={styles.previewNoticeBanner} accessibilityRole="alert" accessibilityLiveRegion="polite">
            <Ionicons name="sparkles-outline" size={16} color={theme.colors.brandForest} />
            <View style={styles.previewNoticeContent}>
              <Text style={styles.previewNoticeText}>
                Trajeto sugerido a partir do seu ponto de partida
              </Text>
              {previewData && (
                <Text style={styles.previewNoticeSubtext}>
                  Distância estimada: {(previewData.distance_m / 1000).toFixed(1)} km • Tempo: ~{Math.round(previewData.duration_s / 60)} min
                </Text>
              )}
            </View>
          </View>
        )}

        {isGoogleRoutesPreview && previewData ? (
          <GoogleRoutesMapNotice
            distanceMeters={previewData.distance_m}
            durationSeconds={previewData.duration_s}
          />
        ) : (
          <RouteMapPreview
            routeId={routeId}
            originId={isCustomLocation ? undefined : effectiveOrigin}
            customGeometry={customGeometry}
            customBounds={customBounds}
            customPins={isCustomLocation ? previewData?.pins : undefined}
            customLegend={isCustomLocation ? previewData?.legend : undefined}
            customCityBounds={isCustomLocation ? previewData?.city_bounds : undefined}
            isCustomLocation={isCustomLocation}
            onExpand={(selectedActorId) => {
              if (isCustomLocation && previewData && queryClient) {
                queryClient.setQueryData(queryKeys.routes.ephemeralPreview(routeId), {
                  previewData,
                  originType: originId || MY_LOCATION_ORIGIN_ID,
                });
              }
              router.push(routePath(routeId, 'map', isCustomLocation ? undefined : effectiveOrigin, selectedActorId ?? actorId));
            }}
          />
        )}

        <LocalCatalogPreview
          routeId={routeId}
          originId={isCustomLocation ? undefined : effectiveOrigin}
          onOpenActor={(selectedActorId) =>
            router.push(`/actor/${encodeURIComponent(selectedActorId)}`)
          }
          onOpenCatalog={(category) =>
            router.push(routePath(routeId, 'catalog', isCustomLocation ? undefined : effectiveOrigin, actorId, category))
          }
        />

        {/* Actions: Start Trip CTA & Trip History Link */}
        <View style={styles.tripActionsContainer}>
          <TouchableOpacity
            style={[
              styles.startTripCard,
              {
                backgroundColor: theme.colors.brandForest,
                borderColor: theme.isHighContrast ? theme.colors.brandDeep : 'transparent',
                borderWidth: theme.isHighContrast ? 2 : 0,
              },
            ]}
            onPress={handleStartTrip}
            disabled={isStartingTrip}
            {...makeAccessibleButton(
              'Registrar início de viagem nesta rota',
              'Inicia a viagem e registra o passeio no histórico do seu perfil'
            )}
          >
            {isStartingTrip ? (
              <View style={styles.startTripLoadingContent}>
                <ActivityIndicator size="small" color={theme.colors.surfaceWhite} />
                <Text style={[styles.startTripText, { color: theme.colors.surfaceWhite }]}>
                  Iniciando viagem...
                </Text>
              </View>
            ) : (
              <View style={styles.startTripContent}>
                <View style={styles.tripIconBox}>
                  <Ionicons name="navigate-outline" size={21} color={theme.colors.surfaceWhite} />
                </View>
                <View style={styles.tripCopy}>
                  <Text style={[styles.startTripText, { color: theme.colors.surfaceWhite }]}>
                    Registrar Início da Viagem
                  </Text>
                  <Text style={styles.startTripSubtext}>Ativar registro em tempo real</Text>
                </View>
                <Ionicons name="play" size={16} color={theme.colors.surfaceWhite} style={{ opacity: 0.85 }} />
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.historyTripButton,
              {
                borderColor: theme.isHighContrast ? theme.colors.outline : 'rgba(51, 96, 30, 0.15)',
              },
            ]}
            onPress={() => router.push('/(tabs)/(profile)/trips')}
            {...makeAccessibleButton('Ver histórico de viagens', 'Abre o histórico de viagens do perfil')}
          >
            <View style={styles.historyIconBox}>
              <Ionicons name="time-outline" size={18} color={theme.colors.brandForest} />
            </View>
            <View style={styles.historyCopy}>
              <Text style={styles.historyButtonText}>Ver histórico de viagens</Text>
              <Text style={styles.historyButtonSubtext}>Consultar passeios e trajetos registrados</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={theme.colors.brandForest} />
          </TouchableOpacity>
        </View>

        {/* Route Alerts Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Alertas da Rota</Text>
          {alerts.isPending ? (
            <LoadingView message="Carregando alertas..." />
          ) : alerts.isError ? (
            <ErrorStateView
              message="Erro ao carregar alertas."
              onRetry={() => void alerts.refetch()}
            />
          ) : alerts.data && alerts.data.length > 0 ? (
            <View style={styles.alertsContainer}>
              {alerts.data.map((alert) => {
                let alertColor: string = theme.colors.brandForest;
                let alertBg: string = 'rgba(51, 96, 30, 0.08)';
                let alertIcon: keyof typeof Ionicons.glyphMap = 'information-circle-outline';

                if (alert.severity === 'warning') {
                  alertColor = theme.colors.brandSun;
                  alertBg = 'rgba(217, 119, 6, 0.1)';
                  alertIcon = 'warning-outline';
                } else if (alert.severity === 'critical') {
                  alertColor = theme.colors.error;
                  alertBg = 'rgba(220, 38, 38, 0.1)';
                  alertIcon = 'alert-circle-outline';
                }

                return (
                  <View key={alert.id} style={[styles.alertCard, { backgroundColor: alertBg }]}>
                    <Ionicons name={alertIcon} size={20} color={alertColor} />
                    <View style={styles.alertTextWrapper}>
                      <Text style={[styles.alertTitle, { color: alertColor }]}>
                        {alert.title}
                      </Text>
                      <Text style={styles.alertMessage}>{alert.message}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={styles.emptyAlertsCard}>
              <Ionicons name="checkmark-circle-outline" size={18} color={theme.colors.brandForest} />
              <Text style={styles.emptyAlertsText}>Nenhum alerta ativo no momento.</Text>
            </View>
          )}
        </View>

        </MotionBlock>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surfaceBackground,
  },
  content: {
    width: '100%',
    maxWidth: '100%',
    overflow: 'hidden',
    padding: theme.spacing.marginMobile,
    paddingBottom: 36,
    gap: 24,
  },
  heroSection: {
    gap: 4,
  },
  heroSectionWithImage: {
    height: 320,
    borderRadius: 24,
    backgroundColor: theme.colors.surfaceBackground,
    overflow: 'hidden',
  },
  heroImage: {
    borderRadius: 24,
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    gap: 4,
    padding: theme.spacing.marginMobile,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  pindobalHeroStack: {
    position: 'relative',
    marginBottom: 8,
  },
  originSelectorOverlay: {
    marginTop: -72,
    paddingHorizontal: 16,
    zIndex: 1,
  },
  titleOnImage: {
    color: theme.colors.surfaceWhite,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  subtitleOnImage: {
    color: 'rgba(255, 255, 255, 0.95)',
    textShadowColor: 'rgba(0, 0, 0, 0.70)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 5,
  },
  descriptionCard: {
    gap: 8,
    backgroundColor: theme.colors.surfaceContainerLow,
    padding: 16,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
  },
  descriptionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  descriptionHeading: {
    ...theme.typography.labelMd,
    color: theme.colors.brandForest,
    fontWeight: '700',
  },
  descriptionBody: {
    ...theme.typography.bodyMd,
    color: theme.colors.onSurface,
    lineHeight: 22,
  },
  descriptionOnImage: {
    color: 'rgba(255, 255, 255, 0.94)',
    textShadowColor: 'rgba(0, 0, 0, 0.55)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  title: {
    ...theme.typography.headlineLg,
    color: theme.colors.brandDeep,
  },
  subtitle: {
    ...theme.typography.labelSm,
    color: theme.colors.brandForest,
    fontWeight: '700',
  },
  description: {
    ...theme.typography.bodyMd,
    color: theme.colors.onSurfaceVariant,
    marginTop: 4,
    lineHeight: 22,
  },
  previewNoticeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(51, 96, 30, 0.08)',
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.brandForest,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: theme.radii.md,
  },
  previewNoticeContent: {
    flex: 1,
  },
  previewNoticeText: {
    ...theme.typography.labelSm,
    color: theme.colors.brandForest,
    fontWeight: '700',
    fontSize: 12,
  },
  previewNoticeSubtext: {
    ...theme.typography.bodySm,
    color: theme.colors.onSurfaceVariant,
    fontSize: 11,
    marginTop: 2,
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    ...theme.typography.headlineSm,
    color: theme.colors.brandForest,
  },
  tripActionsContainer: {
    gap: 8,
    marginVertical: 4,
  },
  startTripCard: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 64,
    borderRadius: theme.radii.lg,
    justifyContent: 'center',
    ...theme.shadows.card,
  },
  startTripContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  startTripLoadingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    minHeight: 40,
  },
  startTripText: {
    ...theme.typography.labelMd,
    fontWeight: '700',
  },
  startTripSubtext: { ...theme.typography.bodySm, color: 'rgba(255,255,255,0.78)', fontSize: 11 },
  tripIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.24)',
  },
  tripCopy: { flex: 1, gap: 2 },
  historyTripButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 52,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.surfaceContainerLow,
    borderWidth: 1,
  },
  historyIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(51, 96, 30, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyCopy: {
    flex: 1,
    gap: 2,
  },
  historyButtonText: {
    ...theme.typography.labelMd,
    color: theme.colors.brandForest,
    fontWeight: '600',
  },
  historyButtonSubtext: {
    ...theme.typography.bodySm,
    color: theme.colors.onSurfaceVariant,
    fontSize: 11,
  },
  alertsContainer: {
    gap: 8,
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: theme.radii.md,
    gap: 10,
  },
  alertTextWrapper: {
    flex: 1,
  },
  alertTitle: {
    ...theme.typography.labelMd,
    fontWeight: '700',
    marginBottom: 2,
  },
  alertMessage: {
    ...theme.typography.bodySm,
    color: theme.colors.onSurfaceVariant,
    fontSize: 12,
    lineHeight: 16,
  },
  emptyAlertsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: theme.colors.surfaceContainerLow,
    padding: 12,
    borderRadius: theme.radii.md,
  },
  emptyAlertsText: {
    ...theme.typography.bodySm,
    color: theme.colors.brandForest,
  },
  notFoundBackButton: {
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  notFoundBackText: {
    ...theme.typography.labelMd,
    color: theme.colors.brandForest,
    fontWeight: '700',
  },
});
