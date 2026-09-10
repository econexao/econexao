import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { CategoryFilters } from '../../../src/components/catalog/CategoryFilters';
import { CategoryCarouselsCatalog } from '../../../src/components/catalog/CategoryCarouselsCatalog';
import { AppHeader } from '../../../src/components/common/AppHeader';
import { ErrorStateView, LoadingView } from '../../../src/components/common/UIStateViews';
import { SearchInput } from '../../../src/components/common/SearchInput';
import { flattenUniquePages, useActorCategoriesQuery, useInfiniteRouteActorsQuery, useMyFavoriteActorsQuery } from '../../../src/hooks/queries';
import { useOptimisticFavoriteActor } from '../../../src/hooks/useOptimisticFavoriteActor';
import { useAuth } from '../../../src/hooks/useAuth';
import { theme } from '../../../src/theme/theme';
import type { ActorSummary } from '../../../src/api/types';

export default function CatalogScreen() {
  const router = useRouter();
  const {
    routeId = '',
    originId,
    actorId,
    category: initialCategory,
    q: initialQuery,
  } = useLocalSearchParams<{
    routeId: string;
    originId?: string;
    actorId?: string;
    category?: string;
    q?: string;
  }>();

  const [q, setQ] = useState(initialQuery?.trim() || '');
  const [debouncedQ, setDebouncedQ] = useState(initialQuery?.trim() || '');
  const [category, setCategory] = useState(initialCategory?.trim() || '');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQ(q);
    }, 350);
    return () => clearTimeout(timer);
  }, [q]);

  const { toggleFavorite } = useOptimisticFavoriteActor();
  const { user } = useAuth();
  const favoriteActorsQuery = useMyFavoriteActorsQuery(user?.id);

  const categories = useActorCategoriesQuery();
  const actorsQuery = useInfiniteRouteActorsQuery(routeId, {
    q: debouncedQ || undefined,
    category: category || undefined,
    origin_id: originId,
  });

  useEffect(() => {
    if (actorsQuery.hasNextPage && !actorsQuery.isFetchingNextPage) {
      void actorsQuery.fetchNextPage();
    }
  }, [actorsQuery.hasNextPage, actorsQuery.isFetchingNextPage, actorsQuery.fetchNextPage]);

  const allActors: ActorSummary[] = flattenUniquePages(actorsQuery.data?.pages);
  const favoriteItems = Array.isArray(favoriteActorsQuery.data)
    ? favoriteActorsQuery.data
    : Array.isArray((favoriteActorsQuery.data as any)?.items)
    ? (favoriteActorsQuery.data as any).items
    : [];
  const favoriteActorIds = new Set<string>(
    favoriteItems
      .map((actor: any) => (typeof actor?.id === 'string' ? actor.id : ''))
      .filter((id: string): id is string => Boolean(id))
  );

  return (
    <View style={styles.container}>
      <AppHeader showBack onBackPress={() => router.back()} title="Catálogo de Atores" />

      <View style={styles.headerControls}>
        <SearchInput
          value={q}
          onChangeText={setQ}
          onClear={() => setQ('')}
          placeholder="Buscar empreendimentos na rota..."
        />
        <CategoryFilters
          categories={categories.data ?? []}
          selectedCategory={category}
          onSelectCategory={setCategory}
        />
        {categories.isPending && <LoadingView message="Carregando categorias..." />}
        {categories.isError && (
          <ErrorStateView
            message="Não foi possível carregar as categorias."
            onRetry={() => void categories.refetch()}
          />
        )}
        {favoriteActorsQuery.isError && (
          <ErrorStateView
            message="Não foi possível carregar seus favoritos."
            onRetry={() => void favoriteActorsQuery.refetch()}
          />
        )}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <CategoryCarouselsCatalog
          actors={allActors}
          categories={categories.data ?? []}
          selectedCategory={category}
          searchQuery={debouncedQ}
          focusedActorId={actorId}
          favoriteActorIds={favoriteActorIds}
          onToggleFavorite={
            favoriteActorsQuery.isSuccess
              ? (actor, isFav) => toggleFavorite(actor, isFav)
              : undefined
          }
          onSelectActor={(actor) => {
            const query = new URLSearchParams();
            if (originId) query.set('originId', originId);
            const suffix = query.toString();
            router.push(`/actor/${encodeURIComponent(actor.id)}${suffix ? `?${suffix}` : ''}`);
          }}
          isLoading={actorsQuery.isPending}
          isError={actorsQuery.isError && allActors.length === 0}
          onRetry={() => void actorsQuery.refetch()}
          onResetFilters={() => {
            setQ('');
            setCategory('');
          }}
        />

        {actorsQuery.hasNextPage && (
          <TouchableOpacity
            style={styles.loadMoreButton}
            onPress={() => void actorsQuery.fetchNextPage()}
            disabled={actorsQuery.isFetchingNextPage}
            accessibilityRole="button"
            accessibilityLabel="Carregar mais atores da rota"
            accessibilityState={{
              disabled: actorsQuery.isFetchingNextPage,
              busy: actorsQuery.isFetchingNextPage,
            }}
          >
            {actorsQuery.isFetchingNextPage ? (
              <ActivityIndicator size="small" color="#059669" />
            ) : (
              <Text style={styles.loadMoreText}>Carregar Mais Estabelecimentos</Text>
            )}
          </TouchableOpacity>
        )}
        {actorsQuery.isError && allActors.length > 0 && (
          <ErrorStateView
            message="Não foi possível carregar mais estabelecimentos."
            onRetry={() => void actorsQuery.fetchNextPage()}
          />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surfaceBackground,
  },
  headerControls: {
    backgroundColor: theme.colors.surfaceWhite,
    paddingHorizontal: theme.spacing.marginMobile,
    paddingTop: 8,
    paddingBottom: 8,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(117, 155, 113, 0.15)',
  },
  content: {
    paddingVertical: 16,
    paddingBottom: 40,
  },
  loadMoreButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#059669',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginHorizontal: theme.spacing.marginMobile,
    marginTop: 8,
    marginBottom: 16,
  },
  loadMoreText: {
    color: '#059669',
    fontSize: 14,
    fontWeight: '600',
  },
});
