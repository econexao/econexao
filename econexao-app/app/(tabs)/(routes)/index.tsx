import React, { useEffect } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';

import { AppHeader } from '../../../src/components/common/AppHeader';
import { EmptyStateView, ErrorStateView, LoadingView } from '../../../src/components/common/UIStateViews';
import { RouteCard } from '../../../src/components/routes/RouteCard';
import { useApp } from '../../../src/hooks/useApp';
import { useAuth } from '../../../src/hooks/useAuth';
import { useResponsiveLayout } from '../../../src/hooks/useResponsiveLayout';
import { flattenUniquePages, prefetchRouteData, prefetchRouteDetailOnly, useInfiniteRoutesQuery, useRegionsQuery, useRoutesQuery } from '../../../src/hooks/queries';
import { useOptimisticFavoriteRoute } from '../../../src/hooks/useOptimisticFavoriteRoute';
import { theme } from '../../../src/theme/theme';
import type { RouteSummary } from '../../../src/api/types';
import { isRouteAvailable, mergeRoutesWithPreviews } from '../../../src/constants/previewRoutes';
import { MotionBlock } from '../../../src/components/common/MotionBlock';

export default function RoutesScreen() {
  const router = useRouter();
  const { state } = useApp();
  const { user } = useAuth();
  const { isTablet, isDesktop, isWide, horizontalMargin } = useResponsiveLayout();
  const regionsQuery = useRegionsQuery();

  const isAllRegions = !state.activeRegionId || state.activeRegionId === 'all';
  const activeRegion = isAllRegions
    ? null
    : regionsQuery.data?.find((r) => r.id === state.activeRegionId);
  const isAltamiraRegion = activeRegion?.slug === 'altamira-xingu';
  const hasNoRegions = regionsQuery.isSuccess && (regionsQuery.data?.length ?? 0) === 0;

  const queryRegionId = isAllRegions ? undefined : state.activeRegionId;

  const routesQuery = useInfiniteRoutesQuery(
    queryRegionId,
    {},
    user?.id
  );

  const savedRoutesQuery = useRoutesQuery(queryRegionId, { saved: true }, user?.id);
  const { toggleFavorite } = useOptimisticFavoriteRoute();

  const savedRouteIds = new Set(savedRoutesQuery.data?.data?.map((r) => r.id));
  const allRoutes: RouteSummary[] = flattenUniquePages(routesQuery.data?.pages);
  const displayRoutes: RouteSummary[] = routesQuery.data
    ? mergeRoutesWithPreviews(allRoutes, { isAltamiraRegion })
    : [];

  const queryClient = useQueryClient();

  useEffect(() => {
    if (!allRoutes.length || !queryClient) return;
    const availableRoutes = displayRoutes.filter((r) => isRouteAvailable(r)).slice(0, 3);
    if (availableRoutes.length === 0) return;
    const timer = setTimeout(() => {
      for (const route of availableRoutes) {
        prefetchRouteDetailOnly(queryClient, route.id);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [allRoutes.length, displayRoutes, queryClient]);

  return (
    <View style={styles.container}>
      <AppHeader />
      <ScrollView contentContainerStyle={[styles.content, isWide && styles.contentWide]}>
        <MotionBlock staggerIndex={0}>
        {displayRoutes.length > 0 ? (
          <>
            <View style={isWide ? styles.cardsGrid : styles.cardsStack}>
              {displayRoutes.map((route) => {
                const isAvailable = isRouteAvailable(route);
                const isFav =
                  (route as RouteSummary & { is_favorite?: boolean }).is_favorite ??
                  savedRouteIds.has(route.id);
                return (
                  <View
                    key={route.id}
                    style={[
                      styles.cardWrapper,
                      isDesktop
                        ? styles.cardWrapperDesktop
                        : isTablet
                        ? styles.cardWrapperTablet
                        : styles.cardWrapperMobile,
                    ]}
                  >
                    <RouteCard
                      route={route}
                      isFavorite={isFav}
                      onPrefetch={isAvailable && queryClient ? () => prefetchRouteData(queryClient, route.id) : undefined}
                      onPress={isAvailable ? () => router.push(`/route/${route.id}`) : undefined}
                      onToggleFavorite={isAvailable ? () => toggleFavorite(route, isFav) : undefined}
                    />
                  </View>
                );
              })}
            </View>

            {routesQuery.hasNextPage && (
              <TouchableOpacity
                style={[styles.loadMoreButton, isWide && styles.loadMoreButtonWide]}
                onPress={() => void routesQuery.fetchNextPage()}
                disabled={routesQuery.isFetchingNextPage}
                accessibilityRole="button"
                accessibilityLabel="Carregar mais rotas"
                accessibilityState={{ disabled: routesQuery.isFetchingNextPage, busy: routesQuery.isFetchingNextPage }}
              >
                {routesQuery.isFetchingNextPage ? (
                  <ActivityIndicator size="small" color="#059669" />
                ) : (
                  <Text style={styles.loadMoreText}>Carregar Mais Rotas</Text>
                )}
              </TouchableOpacity>
            )}
            {routesQuery.isError && (
              <View style={[styles.stateWrapper, isWide && styles.stateWrapperWide]}>
                <ErrorStateView message="Não foi possível carregar mais rotas." onRetry={() => void routesQuery.fetchNextPage()} />
              </View>
            )}
          </>
        ) : (
          <View style={[styles.stateWrapper, isWide && styles.stateWrapperWide]}>
            {routesQuery.isPending ? (
              <LoadingView message="Carregando rotas..." />
            ) : routesQuery.isError ? (
              <ErrorStateView
                message="Não foi possível carregar a lista de rotas."
                onRetry={() => void routesQuery.refetch()}
              />
            ) : regionsQuery.isError ? (
              <ErrorStateView
                message="Não foi possível carregar as regiões disponíveis."
                onRetry={() => void regionsQuery.refetch()}
              />
            ) : hasNoRegions ? (
              <EmptyStateView
                title="Nenhuma região disponível"
                message="O ambiente ainda não possui regiões cadastradas."
              />
            ) : (
              <EmptyStateView
                title="Nenhuma rota encontrada"
                message="Não há rotas cadastradas para a região selecionada."
              />
            )}
          </View>
        )}
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
    padding: theme.spacing.marginMobile,
    gap: 16,
    paddingBottom: 40,
  },
  contentWide: {
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 24,
  },
  cardsStack: {
    width: '100%',
  },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 24,
    width: '100%',
  },
  cardWrapper: {
    width: '100%',
  },
  cardWrapperMobile: {
    width: '100%',
  },
  cardWrapperTablet: {
    width: '48%',
  },
  cardWrapperDesktop: {
    width: '31.5%',
  },
  loadMoreButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#059669',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  loadMoreButtonWide: {
    maxWidth: 320,
    width: '100%',
    alignSelf: 'center',
  },
  loadMoreText: {
    color: '#059669',
    fontSize: 14,
    fontWeight: '600',
  },
  stateWrapper: {
    width: '100%',
  },
  stateWrapperWide: {
    maxWidth: 640,
    alignSelf: 'center',
  },
});
