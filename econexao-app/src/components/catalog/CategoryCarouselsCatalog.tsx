import React, { useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { ActorCategory, ActorSummary, MapLegendItem } from '../../api/types';
import { theme } from '../../theme/theme';
import { CANONICAL_CATEGORIES, getCategoryVisualMeta } from '../../theme/categoryTheme';
import { CategoryCarouselSection } from './CategoryCarouselSection';
import { EmptyStateView, ErrorStateView, LoadingView } from '../common/UIStateViews';

const TYPE_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  restaurante: 'restaurant-outline',
  bar_vida_noturna: 'beer-outline',
  cafe_lanchonete: 'cafe-outline',
  mercado_conveniencia: 'cart-outline',
  pousada_hotel: 'bed-outline',
  casa_temporada: 'home-outline',
  posto_combustivel: 'car-outline',
  farmacia: 'medkit-outline',
  hospital_upa: 'medical-outline',
  posto_saude_ubs: 'fitness-outline',
  nao_classificado: 'help-circle-outline',
};

export type SortMode = 'default' | 'alphabetical';

export interface CategoryCarouselsCatalogProps {
  actors: ActorSummary[];
  categories: Array<ActorCategory | MapLegendItem>;
  selectedCategory?: string;
  searchQuery?: string;
  focusedActorId?: string;
  favoriteActorIds?: Set<string>;
  onToggleFavorite?: (actor: ActorSummary, currentStatus: boolean) => void;
  onSelectActor: (actor: ActorSummary) => void;
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  onResetFilters?: () => void;
}

export const CategoryCarouselsCatalog: React.FC<CategoryCarouselsCatalogProps> = ({
  actors,
  categories,
  selectedCategory,
  searchQuery,
  focusedActorId,
  favoriteActorIds = new Set(),
  onToggleFavorite,
  onSelectActor,
  isLoading = false,
  isError = false,
  onRetry,
  onResetFilters,
}) => {
  const [sortMode, setSortMode] = useState<SortMode>('default');

  // Search and category filters are applied by the API before results reach this component.
  // Re-filtering here can discard valid server-ranked matches (for example, matches in
  // fields that are not represented by this summary model).
  const filteredActors = actors;

  // Group actors by category
  const groupedSections = useMemo(() => {
    const groups: Record<string, {
      meta: ReturnType<typeof getCategoryVisualMeta>;
      typeSlug?: string;
      typeLabel?: string;
      typeIcon?: keyof typeof Ionicons.glyphMap;
      items: ActorSummary[];
    }> = {};

    // Initialize all canonical categories or categories present in props
    const categorySlugs = new Set<string>();
    for (const cat of categories) {
      const slug = 'category_slug' in cat ? cat.category_slug : cat.slug;
      if (slug) categorySlugs.add(slug.toLowerCase());
    }

    // Ensure canonical categories are tracked in order
    Object.keys(CANONICAL_CATEGORIES).forEach((slug) => categorySlugs.add(slug));

    // Place actors into their category
    for (const actor of filteredActors) {
      const categorySlug = (actor.category_slug || 'outros').toLowerCase();
      const typeSlug = actor.type_slug?.toLowerCase();
      const groupKey = typeSlug ? `${categorySlug}:${typeSlug}` : categorySlug;
      if (!groups[groupKey]) {
        groups[groupKey] = {
          meta: getCategoryVisualMeta(categorySlug, actor.category_label),
          typeSlug,
          typeLabel: actor.type_label || undefined,
          typeIcon: (typeSlug && TYPE_ICONS[typeSlug]) || undefined,
          items: [],
        };
      }
      groups[groupKey].items.push(actor);
    }

    // Sort items within each group according to sortMode
    Object.values(groups).forEach((group) => {
      if (sortMode === 'alphabetical') {
        group.items.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' }));
      }
      // If default: keep natural deterministic backend order
    });

    // Convert to sorted array of sections
    const sections = Object.entries(groups)
      .filter(([_, group]) => group.items.length > 0)
      .map(([key, group]) => ({
        key,
        slug: group.meta.slug,
        meta: group.meta,
        typeSlug: group.typeSlug,
        typeLabel: group.typeLabel,
        typeIcon: group.typeIcon,
        items: group.items,
      }));

    // Sort sections by canonical order
    sections.sort((a, b) => a.meta.order - b.meta.order || (a.typeLabel || '').localeCompare(b.typeLabel || '', 'pt-BR'));

    return sections;
  }, [filteredActors, categories, sortMode]);

  if (isLoading) {
    return <LoadingView message="Carregando catálogo..." />;
  }

  if (isError && actors.length === 0) {
    return (
      <ErrorStateView
        title="Erro ao carregar catálogo"
        message="Não foi possível obter a lista de estabelecimentos para esta rota."
        onRetry={onRetry}
      />
    );
  }

  if (filteredActors.length === 0) {
    return (
      <EmptyStateView
        title="Nenhum estabelecimento encontrado"
        message="Tente ajustar os filtros ou a busca para visualizar outros resultados."
        onReset={onResetFilters}
        resetLabel="Limpar filtros"
      />
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.topToolbar}>
        <Text style={styles.summaryText}>
          {filteredActors.length} {filteredActors.length === 1 ? 'estabelecimento' : 'estabelecimentos'} em{' '}
          {groupedSections.length} {groupedSections.length === 1 ? 'categoria' : 'categorias'}
        </Text>

        <View style={styles.sortContainer}>
          <TouchableOpacity
            style={[styles.sortButton, sortMode === 'default' && styles.sortButtonActive]}
            onPress={() => setSortMode('default')}
            accessible
            accessibilityRole="button"
            accessibilityLabel="Ordenar por relevância padrão"
            accessibilityState={{ selected: sortMode === 'default' }}
          >
            <Text
              style={[styles.sortButtonText, sortMode === 'default' && styles.sortButtonTextActive]}
            >
              Relevância
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.sortButton, sortMode === 'alphabetical' && styles.sortButtonActive]}
            onPress={() => setSortMode('alphabetical')}
            accessible
            accessibilityRole="button"
            accessibilityLabel="Ordenar de A a Z"
            accessibilityState={{ selected: sortMode === 'alphabetical' }}
          >
            <Text
              style={[
                styles.sortButtonText,
                sortMode === 'alphabetical' && styles.sortButtonTextActive,
              ]}
            >
              A-Z
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.sectionsList}>
        {groupedSections.map((section) => (
          <CategoryCarouselSection
            key={section.key}
            categorySlug={section.slug}
            categoryLabel={section.meta.label}
            typeLabel={section.typeLabel}
            typeIcon={section.typeIcon}
            actors={section.items}
            focusedActorId={focusedActorId}
            favoriteActorIds={favoriteActorIds}
            onToggleFavorite={onToggleFavorite}
            onSelectActor={onSelectActor}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingBottom: 24,
  },
  topToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.marginMobile,
    marginBottom: 16,
    flexWrap: 'wrap',
    gap: 8,
  },
  summaryText: {
    ...theme.typography.labelSm,
    color: theme.colors.brandForest,
    fontWeight: '600',
  },
  sortContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surfaceContainerLow,
    borderRadius: theme.radii.full,
    padding: 3,
    gap: 4,
  },
  sortButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.radii.full,
  },
  sortButtonActive: {
    backgroundColor: theme.colors.surfaceWhite,
    ...theme.shadows.sm,
  },
  sortButtonText: {
    ...theme.typography.labelSm,
    color: theme.colors.onSurfaceVariant,
    fontWeight: '600',
  },
  sortButtonTextActive: {
    color: theme.colors.brandForest,
    fontWeight: '700',
  },
  sectionsList: {
    width: '100%',
  },
});
