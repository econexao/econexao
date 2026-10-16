import React from 'react';
import { ScrollView, Text, TouchableOpacity } from 'react-native';
import renderer, { act } from 'react-test-renderer';

import { RouteCarouselSection } from './RouteCarouselSection';
import { CompactRouteCard } from './CompactRouteCard';
import type { RouteSummary } from '../../api/types';
import * as useReducedMotionModule from '../../hooks/useReducedMotion';

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

describe('RouteCarouselSection', () => {
  beforeEach(() => {
    jest.spyOn(useReducedMotionModule, 'useReducedMotion').mockReturnValue(false);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });
  const mockRoutes: RouteSummary[] = [
    {
      id: 'route-1',
      slug: 'rota-tapajos',
      title: 'Rota Tapajós',
      summary: 'Percurso pelo rio Tapajós.',
      city: 'Santarém',
      state_code: 'PA',
      status: 'active',
      is_verified: true,
      best_season: null,
      cover_image_url: null,
      cover_media: null,
      is_favorite: false,
    },
    {
      id: 'route-2',
      slug: 'rota-alter',
      title: 'Rota Alter do Chão',
      summary: 'Praias e florestas de Alter.',
      city: 'Santarém',
      state_code: 'PA',
      status: 'active',
      is_verified: false,
      best_season: null,
      cover_image_url: null,
      cover_media: null,
      is_favorite: false,
    },
    {
      id: 'route-3',
      slug: 'rota-flona',
      title: 'Rota Floresta Nacional',
      summary: 'Trilha pela Flona do Tapajós.',
      city: 'Belterra',
      state_code: 'PA',
      status: 'active',
      is_verified: true,
      best_season: null,
      cover_image_url: null,
      cover_media: null,
      is_favorite: false,
    },
  ];

  it('renders section header with title and seeAllLink', () => {
    const onSeeAllMock = jest.fn();
    let tree!: renderer.ReactTestRenderer;

    act(() => {
      tree = renderer.create(
        <RouteCarouselSection
          title="Rotas em Destaque"
          routes={mockRoutes}
          onSelectRoute={jest.fn()}
          seeAllLink={{
            label: 'Ver todas',
            onPress: onSeeAllMock,
          }}
        />
      );
    });

    const texts = tree.root
      .findAllByType(Text)
      .map((t) => (Array.isArray(t.props.children) ? t.props.children.join('') : t.props.children));

    expect(texts).toContain('Rotas em Destaque');
    expect(texts).toContain('Ver todas');

    const seeAllButton = tree.root.findAllByType(TouchableOpacity).find(
      (btn) => btn.props.accessibilityLabel === 'Ver todas'
    );
    expect(seeAllButton).toBeDefined();

    act(() => {
      seeAllButton?.props.onPress();
    });
    expect(onSeeAllMock).toHaveBeenCalledTimes(1);
  });

  it('renders CompactRouteCards inside horizontal ScrollView', () => {
    let tree!: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(
        <RouteCarouselSection
          title="Rotas em Destaque"
          routes={mockRoutes}
          savedRouteIds={new Set(['route-2'])}
          onSelectRoute={jest.fn()}
        />
      );
    });

    const cards = tree.root.findAllByType(CompactRouteCard);
    expect(cards).toHaveLength(3);
    expect(cards[0].props.route.title).toBe('Rota Tapajós');
    expect(cards[0].props.isFavorite).toBe(false);
    expect(cards[1].props.route.title).toBe('Rota Alter do Chão');
    expect(cards[1].props.isFavorite).toBe(true);
  });

  it('renders navigation buttons when multiple routes exist with boundary disabled states', () => {
    let tree!: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(
        <RouteCarouselSection
          title="Rotas em Destaque"
          routes={mockRoutes}
          onSelectRoute={jest.fn()}
        />
      );
    });

    const prevButton = tree.root
      .findAllByType(TouchableOpacity)
      .find((b) => b.props.accessibilityLabel === 'Anterior em Rotas em Destaque');
    const nextButton = tree.root
      .findAllByType(TouchableOpacity)
      .find((b) => b.props.accessibilityLabel === 'Próximo em Rotas em Destaque');

    expect(prevButton).toBeDefined();
    expect(nextButton).toBeDefined();

    // At initial position (scrollX = 0), Previous button is disabled
    expect(prevButton?.props.disabled).toBe(true);

    const scrollView = tree.root.findByType(ScrollView);

    // Simulate layout: container = 500, content = 1000
    act(() => {
      scrollView.props.onLayout({ nativeEvent: { layout: { width: 500 } } });
      scrollView.props.onContentSizeChange(1000, 200);
    });

    // Re-check next button (canScrollRight = 1000 > 500 && 0 < 1000 - 500 - 10 => true)
    const updatedNext = tree.root
      .findAllByType(TouchableOpacity)
      .find((b) => b.props.accessibilityLabel === 'Próximo em Rotas em Destaque');
    expect(updatedNext?.props.disabled).toBe(false);

    // Simulate scroll to middle (scrollX = 200)
    act(() => {
      scrollView.props.onScroll({ nativeEvent: { contentOffset: { x: 200 } } });
    });

    const middlePrev = tree.root
      .findAllByType(TouchableOpacity)
      .find((b) => b.props.accessibilityLabel === 'Anterior em Rotas em Destaque');
    const middleNext = tree.root
      .findAllByType(TouchableOpacity)
      .find((b) => b.props.accessibilityLabel === 'Próximo em Rotas em Destaque');

    expect(middlePrev?.props.disabled).toBe(false);
    expect(middleNext?.props.disabled).toBe(false);

    // Simulate scroll to end (scrollX = 500)
    act(() => {
      scrollView.props.onScroll({ nativeEvent: { contentOffset: { x: 500 } } });
    });

    const endNext = tree.root
      .findAllByType(TouchableOpacity)
      .find((b) => b.props.accessibilityLabel === 'Próximo em Rotas em Destaque');
    expect(endNext?.props.disabled).toBe(true);
  });

  it('triggers scroll and live region announcements on navigation clicks', () => {
    let tree!: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(
        <RouteCarouselSection
          title="Rotas em Destaque"
          routes={mockRoutes}
          onSelectRoute={jest.fn()}
        />
      );
    });

    const scrollView = tree.root.findByType(ScrollView);
    const scrollToMock = jest.fn();
    (scrollView.instance as any).scrollTo = scrollToMock;

    act(() => {
      scrollView.props.onLayout({ nativeEvent: { layout: { width: 400 } } });
      scrollView.props.onContentSizeChange(1200, 200);
    });

    const nextButton = tree.root
      .findAllByType(TouchableOpacity)
      .find((b) => b.props.accessibilityLabel === 'Próximo em Rotas em Destaque');

    act(() => {
      nextButton?.props.onPress();
    });

    expect(scrollToMock).toHaveBeenCalledTimes(1);

    // Check announcement in live region
    const liveRegion = tree.root
      .findAllByType(Text)
      .find((t) => t.props.accessibilityLiveRegion === 'polite');
    expect(liveRegion?.props.children).toBe('Mostrando próximas rotas de Rotas em Destaque');

    // Simulate scroll offset and click Previous
    act(() => {
      scrollView.props.onScroll({ nativeEvent: { contentOffset: { x: 512 } } });
    });

    const prevButton = tree.root
      .findAllByType(TouchableOpacity)
      .find((b) => b.props.accessibilityLabel === 'Anterior em Rotas em Destaque');

    act(() => {
      prevButton?.props.onPress();
    });

    expect(scrollToMock).toHaveBeenCalledTimes(2);
    expect(liveRegion?.props.children).toBe('Mostrando rotas anteriores de Rotas em Destaque');
  });

  it('preserves route selection and favorite toggle interactivity', () => {
    const onSelectRouteMock = jest.fn();
    const onToggleFavoriteMock = jest.fn();
    const onPrefetchRouteMock = jest.fn();

    let tree!: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(
        <RouteCarouselSection
          title="Rotas em Destaque"
          routes={mockRoutes}
          onSelectRoute={onSelectRouteMock}
          onToggleFavorite={onToggleFavoriteMock}
          onPrefetchRoute={onPrefetchRouteMock}
        />
      );
    });

    const firstCard = tree.root.findAllByType(CompactRouteCard)[0];
    expect(firstCard).toBeDefined();

    act(() => {
      firstCard.props.onPress();
    });
    expect(onSelectRouteMock).toHaveBeenCalledWith(mockRoutes[0]);

    act(() => {
      firstCard.props.onToggleFavorite();
    });
    expect(onToggleFavoriteMock).toHaveBeenCalledWith(mockRoutes[0], false);

    act(() => {
      firstCard.props.onPrefetch();
    });
    expect(onPrefetchRouteMock).toHaveBeenCalledWith(mockRoutes[0].id);
  });

  it('renders variant="onImage" with contrast styles and variant="surface"', () => {
    let onImageTree!: renderer.ReactTestRenderer;
    act(() => {
      onImageTree = renderer.create(
        <RouteCarouselSection
          title="Rotas Salvas"
          routes={mockRoutes}
          variant="onImage"
          onSelectRoute={jest.fn()}
        />
      );
    });

    const titleText = onImageTree.root
      .findAllByType(Text)
      .find((t) => t.props.children === 'Rotas Salvas');
    expect(titleText).toBeDefined();

    let surfaceTree!: renderer.ReactTestRenderer;
    act(() => {
      surfaceTree = renderer.create(
        <RouteCarouselSection
          title="Rotas Recomendadas"
          routes={mockRoutes}
          variant="surface"
          onSelectRoute={jest.fn()}
        />
      );
    });

    const surfaceTitle = surfaceTree.root
      .findAllByType(Text)
      .find((t) => t.props.children === 'Rotas Recomendadas');
    expect(surfaceTitle).toBeDefined();
  });

  it('renders loading, error and empty states honestly', () => {
    let loadingTree!: renderer.ReactTestRenderer;
    act(() => {
      loadingTree = renderer.create(
        <RouteCarouselSection
          title="Rotas em Destaque"
          routes={[]}
          isLoading
          onSelectRoute={jest.fn()}
        />
      );
    });

    const loadingTexts = loadingTree.root
      .findAllByType(Text)
      .map((t) => (Array.isArray(t.props.children) ? t.props.children.join('') : t.props.children));
    expect(loadingTexts).toContain('Carregando rotas...');

    let errorTree!: renderer.ReactTestRenderer;
    const retryFn = jest.fn();
    act(() => {
      errorTree = renderer.create(
        <RouteCarouselSection
          title="Rotas em Destaque"
          routes={[]}
          isError
          onRetry={retryFn}
          onSelectRoute={jest.fn()}
        />
      );
    });

    const errorTexts = errorTree.root
      .findAllByType(Text)
      .map((t) => (Array.isArray(t.props.children) ? t.props.children.join('') : t.props.children));
    expect(errorTexts).toContain('Não foi possível carregar as rotas.');

    const retryBtn = errorTree.root
      .findAllByType(TouchableOpacity)
      .find((b) => b.props.accessibilityLabel === 'Tentar novamente Rotas em Destaque');
    act(() => {
      retryBtn?.props.onPress();
    });
    expect(retryFn).toHaveBeenCalledTimes(1);

    let emptyTree!: renderer.ReactTestRenderer;
    act(() => {
      emptyTree = renderer.create(
        <RouteCarouselSection
          title="Rotas em Destaque"
          routes={[]}
          emptyTitle="Nenhuma rota encontrada"
          emptyMessage="Tente outra região."
          onSelectRoute={jest.fn()}
        />
      );
    });

    const emptyTexts = emptyTree.root
      .findAllByType(Text)
      .map((t) => (Array.isArray(t.props.children) ? t.props.children.join('') : t.props.children));
    expect(emptyTexts).toContain('Nenhuma rota encontrada');
    expect(emptyTexts).toContain('Tente outra região.');
  });
});
