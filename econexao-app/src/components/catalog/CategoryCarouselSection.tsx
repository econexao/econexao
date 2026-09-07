import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { ActorSummary } from '../../api/types';
import { theme } from '../../theme/theme';
import { getCategoryVisualMeta } from '../../theme/categoryTheme';
import { makeAccessibleButton } from '../../utils/accessibility';
import { ActorCard } from './ActorCard';
import { ErrorStateView, LoadingView } from '../common/UIStateViews';

export interface CategoryCarouselSectionProps {
  categorySlug: string;
  categoryLabel: string;
  actors: ActorSummary[];
  totalCount?: number;
  focusedActorId?: string;
  favoriteActorIds?: Set<string>;
  onToggleFavorite?: (actor: ActorSummary, currentStatus: boolean) => void;
  onSelectActor: (actor: ActorSummary) => void;
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
}

const CARD_WIDTH = 280;
const CARD_GAP = 16;
const SCROLL_AMOUNT = CARD_WIDTH + CARD_GAP;

export const CategoryCarouselSection: React.FC<CategoryCarouselSectionProps> = ({
  categorySlug,
  categoryLabel,
  actors,
  totalCount,
  focusedActorId,
  favoriteActorIds = new Set(),
  onToggleFavorite,
  onSelectActor,
  isLoading = false,
  isError = false,
  onRetry,
}) => {
  const scrollRef = useRef<ScrollView>(null);
  const [scrollX, setScrollX] = useState(0);
  const [contentWidth, setContentWidth] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);

  const categoryMeta = getCategoryVisualMeta(categorySlug, categoryLabel);
  const countDisplay = totalCount ?? actors.length;

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = event.nativeEvent.contentOffset.x;
    setScrollX(x);
  };

  const canScrollLeft = scrollX > 10;
  const canScrollRight = contentWidth > containerWidth && scrollX < contentWidth - containerWidth - 10;

  const scrollPrev = () => {
    if (!scrollRef.current) return;
    const targetX = Math.max(0, scrollX - SCROLL_AMOUNT * 2);
    scrollRef.current.scrollTo({ x: targetX, animated: true });
  };

  const scrollNext = () => {
    if (!scrollRef.current) return;
    const maxX = Math.max(0, contentWidth - containerWidth);
    const targetX = Math.min(maxX, scrollX + SCROLL_AMOUNT * 2);
    scrollRef.current.scrollTo({ x: targetX, animated: true });
  };

  return (
    <View
      style={styles.sectionContainer}
      accessibilityRole="none"
      aria-label={`Carrossel da categoria ${categoryMeta.label}`}
    >
      <View style={styles.headerRow}>
        <View style={styles.titleGroup}>
          <View style={[styles.iconContainer, { backgroundColor: categoryMeta.color }]}>
            <Ionicons name={categoryMeta.icon} size={18} color="#FFFFFF" />
          </View>
          <View>
            <Text
              style={styles.categoryTitle}
              accessibilityRole="header"
              aria-level={3}
            >
              {categoryMeta.label}
            </Text>
            <Text style={styles.countSubtitle}>
              {countDisplay} {countDisplay === 1 ? 'estabelecimento' : 'estabelecimentos'}
            </Text>
          </View>
        </View>

        {actors.length > 1 && !isLoading && !isError && (
          <View style={styles.controlsRow}>
            <TouchableOpacity
              style={[styles.navButton, !canScrollLeft && styles.navButtonDisabled]}
              onPress={scrollPrev}
              disabled={!canScrollLeft}
              {...makeAccessibleButton(
                `Anterior em ${categoryMeta.label}`,
                'Rola os estabelecimentos anteriores da categoria',
                !canScrollLeft
              )}
            >
              <Ionicons
                name="chevron-back"
                size={20}
                color={canScrollLeft ? theme.colors.brandDeep : theme.colors.outlineVariant}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.navButton, !canScrollRight && styles.navButtonDisabled]}
              onPress={scrollNext}
              disabled={!canScrollRight}
              {...makeAccessibleButton(
                `Próximo em ${categoryMeta.label}`,
                'Rola os próximos estabelecimentos da categoria',
                !canScrollRight
              )}
            >
              <Ionicons
                name="chevron-forward"
                size={20}
                color={canScrollRight ? theme.colors.brandDeep : theme.colors.outlineVariant}
              />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {isLoading ? (
        <View style={styles.stateContainer}>
          <ActivityIndicator size="small" color={theme.colors.brandForest} />
          <Text style={styles.stateText}>Carregando {categoryMeta.label.toLowerCase()}...</Text>
        </View>
      ) : isError ? (
        <View style={styles.stateContainer}>
          <Text style={styles.errorText}>Não foi possível carregar esta categoria.</Text>
          {onRetry && (
            <TouchableOpacity
              style={styles.retryButton}
              onPress={onRetry}
              {...makeAccessibleButton(`Tentar novamente ${categoryMeta.label}`)}
            >
              <Text style={styles.retryButtonText}>Tentar novamente</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : actors.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="storefront-outline" size={24} color={theme.colors.brandSage} />
          <Text style={styles.emptyText}>
            Nenhum estabelecimento encontrado em {categoryMeta.label}.
          </Text>
        </View>
      ) : (
        <ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
          onContentSizeChange={(w) => setContentWidth(w)}
          contentContainerStyle={styles.carouselContent}
          style={styles.carouselScroller}
        >
          {actors.map((actor) => {
            const isFav =
              (actor as ActorSummary & { is_favorite?: boolean }).is_favorite ??
              favoriteActorIds.has(actor.id);
            const isFocused = actor.id === focusedActorId;

            return (
              <View key={actor.id} style={styles.cardWrapper}>
                <ActorCard
                  actor={actor}
                  isFavorite={isFav}
                  focusOnMount={isFocused}
                  onToggleFavorite={
                    onToggleFavorite ? () => onToggleFavorite(actor, isFav) : undefined
                  }
                  onPress={() => onSelectActor(actor)}
                />
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  sectionContainer: {
    marginBottom: 28,
    width: '100%',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.marginMobile,
    marginBottom: 12,
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconContainer: {
    width: 34,
    height: 34,
    borderRadius: theme.radii.default,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.sm,
  },
  categoryTitle: {
    ...theme.typography.headlineSm,
    color: theme.colors.brandDeep,
    fontWeight: '700',
  },
  countSubtitle: {
    ...theme.typography.labelSm,
    color: theme.colors.onSurfaceVariant,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  navButton: {
    width: 36,
    height: 36,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.surfaceWhite,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.sm,
  },
  navButtonDisabled: {
    opacity: 0.4,
    backgroundColor: theme.colors.surfaceContainerLow,
    borderColor: theme.colors.surfaceContainerHigh,
  },
  carouselScroller: {
    width: '100%',
  },
  carouselContent: {
    paddingHorizontal: theme.spacing.marginMobile,
    gap: CARD_GAP,
    paddingBottom: 8,
  },
  cardWrapper: {
    width: CARD_WIDTH,
  },
  stateContainer: {
    padding: 20,
    marginHorizontal: theme.spacing.marginMobile,
    backgroundColor: theme.colors.surfaceWhite,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    borderColor: 'rgba(117, 155, 113, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 120,
  },
  stateText: {
    ...theme.typography.bodySm,
    color: theme.colors.onSurfaceVariant,
  },
  errorText: {
    ...theme.typography.bodySm,
    color: theme.colors.error,
    fontWeight: '600',
  },
  retryButton: {
    marginTop: 4,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.brandForest,
  },
  retryButtonText: {
    ...theme.typography.labelSm,
    color: theme.colors.onPrimary,
    fontWeight: '700',
  },
  emptyContainer: {
    padding: 20,
    marginHorizontal: theme.spacing.marginMobile,
    backgroundColor: theme.colors.surfaceContainerLow,
    borderRadius: theme.radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 100,
  },
  emptyText: {
    ...theme.typography.bodySm,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
  },
});
