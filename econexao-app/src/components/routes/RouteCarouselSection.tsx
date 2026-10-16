import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { RouteSummary } from '../../api/types';
import { theme } from '../../theme/theme';
import { makeAccessibleButton } from '../../utils/accessibility';
import { CompactRouteCard } from './CompactRouteCard';
import { useReducedMotion } from '../../hooks/useReducedMotion';

export interface RouteCarouselSectionProps {
  title: string;
  routes: RouteSummary[];
  savedRouteIds?: Set<string>;
  onSelectRoute: (route: RouteSummary) => void;
  onToggleFavorite?: (route: RouteSummary, currentStatus: boolean) => void;
  onPrefetchRoute?: (routeId: string) => void;
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  emptyTitle?: string;
  emptyMessage?: string;
  seeAllLink?: {
    onPress: () => void;
    label: string;
    hint?: string;
  };
  variant?: 'onImage' | 'surface';
}

const CARD_WIDTH = 240;
const CARD_GAP = 16;
const SCROLL_AMOUNT = (CARD_WIDTH + CARD_GAP) * 2; // Scrolls 2 cards at a time

export const RouteCarouselSection: React.FC<RouteCarouselSectionProps> = ({
  title,
  routes,
  savedRouteIds,
  onSelectRoute,
  onToggleFavorite,
  onPrefetchRoute,
  isLoading = false,
  isError = false,
  onRetry,
  emptyTitle,
  emptyMessage,
  seeAllLink,
  variant = 'surface',
}) => {
  const scrollRef = useRef<ScrollView>(null);
  const [scrollX, setScrollX] = useState(0);
  const [contentWidth, setContentWidth] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);
  const [announcement, setAnnouncement] = useState('');
  const reducedMotion = useReducedMotion();

  const isOnImage = variant === 'onImage';

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = event.nativeEvent.contentOffset.x;
    setScrollX(x);
  };

  const canScrollLeft = scrollX > 10;
  const canScrollRight =
    contentWidth > containerWidth && scrollX < contentWidth - containerWidth - 10;

  const scrollPrev = () => {
    if (!scrollRef.current) return;
    const targetX = Math.max(0, scrollX - SCROLL_AMOUNT);
    scrollRef.current.scrollTo({ x: targetX, animated: !reducedMotion });
    setAnnouncement(`Mostrando rotas anteriores de ${title}`);
  };

  const scrollNext = () => {
    if (!scrollRef.current) return;
    const maxX = Math.max(0, contentWidth - containerWidth);
    const targetX = Math.min(maxX, scrollX + SCROLL_AMOUNT);
    scrollRef.current.scrollTo({ x: targetX, animated: !reducedMotion });
    setAnnouncement(`Mostrando próximas rotas de ${title}`);
  };

  return (
    <View
      style={styles.sectionContainer}
      accessibilityRole="none"
      aria-label={`Carrossel de ${title}`}
    >
      <View style={styles.headerRow}>
        <Text
          style={isOnImage ? styles.titleOnImage : styles.titleSurface}
          accessibilityRole="header"
          aria-level={3}
        >
          {title}
        </Text>

        <View style={styles.headerActions}>
          {seeAllLink && (
            <TouchableOpacity
              style={styles.seeAllLink}
              onPress={seeAllLink.onPress}
              {...makeAccessibleButton(
                seeAllLink.label,
                seeAllLink.hint ?? `Navega para ver todas as rotas de ${title}`
              )}
            >
              <Text style={isOnImage ? styles.seeAllTextOnImage : styles.seeAllTextSurface}>
                {seeAllLink.label}
              </Text>
              <Ionicons
                name="chevron-forward"
                size={15}
                color={isOnImage ? 'rgba(255, 255, 255, 0.85)' : theme.colors.brandForest}
              />
            </TouchableOpacity>
          )}

          {routes.length > 1 && !isLoading && !isError && (
            <View style={styles.controlsRow}>
              <TouchableOpacity
                style={[
                  isOnImage ? styles.navButtonOnImage : styles.navButtonSurface,
                  !canScrollLeft &&
                    (isOnImage ? styles.navButtonDisabledOnImage : styles.navButtonDisabledSurface),
                ]}
                onPress={scrollPrev}
                disabled={!canScrollLeft}
                {...makeAccessibleButton(
                  `Anterior em ${title}`,
                  `Rola as rotas anteriores de ${title}`,
                  !canScrollLeft
                )}
              >
                <Ionicons
                  name="chevron-back"
                  size={20}
                  color={
                    !canScrollLeft
                      ? isOnImage
                        ? 'rgba(28, 59, 15, 0.35)'
                        : theme.colors.outlineVariant
                      : theme.colors.brandDeep
                  }
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  isOnImage ? styles.navButtonOnImage : styles.navButtonSurface,
                  !canScrollRight &&
                    (isOnImage ? styles.navButtonDisabledOnImage : styles.navButtonDisabledSurface),
                ]}
                onPress={scrollNext}
                disabled={!canScrollRight}
                {...makeAccessibleButton(
                  `Próximo em ${title}`,
                  `Rola as próximas rotas de ${title}`,
                  !canScrollRight
                )}
              >
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={
                    !canScrollRight
                      ? isOnImage
                        ? 'rgba(28, 59, 15, 0.35)'
                        : theme.colors.outlineVariant
                      : theme.colors.brandDeep
                  }
                />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {isLoading ? (
        <View style={styles.stateContainer}>
          <ActivityIndicator size="small" color={theme.colors.brandForest} />
          <Text style={styles.stateText}>Carregando rotas...</Text>
        </View>
      ) : isError ? (
        <View style={styles.stateContainer}>
          <Text style={styles.errorText}>Não foi possível carregar as rotas.</Text>
          {onRetry && (
            <TouchableOpacity
              style={styles.retryButton}
              onPress={onRetry}
              {...makeAccessibleButton(`Tentar novamente ${title}`)}
            >
              <Text style={styles.retryButtonText}>Tentar novamente</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : routes.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="map-outline" size={24} color={theme.colors.brandSage} />
          {emptyTitle ? <Text style={styles.emptyTitleText}>{emptyTitle}</Text> : null}
          <Text style={styles.emptyText}>
            {emptyMessage ?? `Nenhuma rota encontrada em ${title}.`}
          </Text>
        </View>
      ) : (
        <>
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
            {routes.map((route) => {
              const isFav =
                Boolean((route as RouteSummary & { is_favorite?: boolean }).is_favorite) ||
                (savedRouteIds ? savedRouteIds.has(route.id) : false);

              return (
                <CompactRouteCard
                  key={route.id}
                  route={route}
                  isFavorite={isFav}
                  onPrefetch={onPrefetchRoute ? () => onPrefetchRoute(route.id) : undefined}
                  onPress={() => onSelectRoute(route)}
                  onToggleFavorite={
                    onToggleFavorite ? () => onToggleFavorite(route, isFav) : undefined
                  }
                />
              );
            })}
          </ScrollView>
          <Text accessibilityLiveRegion="polite" style={styles.srOnly}>
            {announcement}
          </Text>
        </>
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  titleSurface: {
    ...theme.typography.headlineSm,
    color: theme.colors.brandDeep,
    fontWeight: '700',
    fontSize: 20,
  },
  titleOnImage: {
    ...theme.typography.headlineMd,
    color: theme.colors.surfaceWhite,
    fontWeight: '700',
    fontSize: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  seeAllLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  seeAllTextSurface: {
    ...theme.typography.labelSm,
    color: theme.colors.brandForest,
    fontWeight: '600',
    fontSize: 13,
  },
  seeAllTextOnImage: {
    ...theme.typography.labelSm,
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: '600',
    fontSize: 13,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  navButtonSurface: {
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
  navButtonDisabledSurface: {
    opacity: 0.4,
    backgroundColor: theme.colors.surfaceContainerLow,
    borderColor: theme.colors.surfaceContainerHigh,
  },
  navButtonOnImage: {
    width: 36,
    height: 36,
    borderRadius: theme.radii.full,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.sm,
  },
  navButtonDisabledOnImage: {
    opacity: 0.35,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  carouselScroller: {
    width: '100%',
  },
  carouselContent: {
    paddingHorizontal: theme.spacing.marginMobile,
    paddingVertical: 6,
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
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderRadius: theme.radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 100,
  },
  emptyTitleText: {
    ...theme.typography.titleMd,
    color: theme.colors.brandDeep,
    fontWeight: '700',
  },
  emptyText: {
    ...theme.typography.bodySm,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
  },
  srOnly: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
    overflow: 'hidden',
  },
});
