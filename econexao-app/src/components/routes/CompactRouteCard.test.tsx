import React from 'react';
import { Text } from 'react-native';
import TestRenderer, { act } from 'react-test-renderer';
import { CompactRouteCard } from './CompactRouteCard';
import type { RouteSummary } from '../../api/types';

jest.mock('@expo/vector-icons', () => ({
  Ionicons: () => null,
}));

describe('CompactRouteCard', () => {
  const activeRoute: RouteSummary = {
    id: 'route-active-santarem',
    slug: 'rota-santarem-historica',
    title: 'Centro Histórico de Santarém',
    summary: 'Percurso pelo patrimônio histórico de Santarém.',
    city: 'Santarém',
    state_code: 'PA',
    status: 'active',
    is_verified: true,
    best_season: 'Período de seca e vazante do rio Tapajós',
    cover_image_url: null,
    cover_media: null,
    is_favorite: false,
  };

  const previewRoute: RouteSummary = {
    id: 'preview-route-alter-do-chao',
    slug: 'rota-alter-do-chao',
    title: 'Praia do Amor (Alter do Chão)',
    summary: 'Praia do Amor e corredor de Alter do Chão.',
    city: 'Santarém',
    state_code: 'PA',
    status: 'active',
    is_verified: false,
    best_season: null,
    cover_image_url: null,
    cover_media: null,
    is_favorite: false,
  };

  const unavailableRoute: RouteSummary = {
    id: 'route-maintenance-1',
    slug: 'rota-manutencao',
    title: 'Trilha do Curuá-Una',
    summary: 'Trilha ecológica.',
    city: 'Santarém',
    state_code: 'PA',
    status: 'inactive',
    is_verified: false,
    best_season: null,
    cover_image_url: null,
    cover_media: null,
    is_favorite: false,
  };

  const pedralRoute: RouteSummary = {
    id: 'a17a314a-0000-4000-8000-000000000002',
    slug: 'rota-pedral',
    title: 'Rota do Pedral',
    summary: 'Percurso ao longo do Rio Xingu até o Balneário Luiz do Pedral.',
    city: 'Altamira',
    state_code: 'PA',
    status: 'active',
    is_verified: true,
    best_season: 'Período de seca e vazante do rio Xingu (julho a novembro)',
    cover_image_url: null,
    cover_media: null,
    is_favorite: false,
  };

  it('renders route title and location without best_season category text for active routes', () => {
    let renderer!: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(<CompactRouteCard route={activeRoute} />);
    });

    const allTexts = renderer.root.findAllByType(Text).map((t) => t.props.children);
    expect(allTexts).toContain('Centro Histórico de Santarém');
    expect(allTexts).toContain('Santarém, PA');
    expect(allTexts).toContain('Verificada');

    // Ensures best_season phrase is omitted from card layout
    expect(allTexts).not.toContain('Período de seca e vazante do rio Tapajós');
  });

  it('standardizes Pedral route title to Balneário Luiz do Pedral and omits best_season phrase', () => {
    let renderer!: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(<CompactRouteCard route={pedralRoute} />);
    });

    const allTexts = renderer.root.findAllByType(Text).map((t) => t.props.children);
    expect(allTexts).toContain('Balneário Luiz do Pedral');
    expect(allTexts).toContain('Altamira, PA');

    const hasBestSeason = allTexts.some((txt) =>
      typeof txt === 'string' && /período de seca/i.test(txt)
    );
    expect(hasBestSeason).toBe(false);
  });

  it('renders preview route with Em breve badge and non-interactive accessibility', () => {
    let renderer!: TestRenderer.ReactTestRenderer;
    const onPressMock = jest.fn();
    const onToggleFavoriteMock = jest.fn();

    act(() => {
      renderer = TestRenderer.create(
        <CompactRouteCard
          route={previewRoute}
          onPress={onPressMock}
          onToggleFavorite={onToggleFavoriteMock}
        />
      );
    });

    const allTexts = renderer.root.findAllByType(Text).map((t) => t.props.children);
    expect(allTexts).toContain('Em breve');

    // Card should not have button role
    const buttonNodes = renderer.root.findAll(
      (node) => node.props.accessibilityRole === 'button'
    );
    expect(buttonNodes.length).toBe(0);

    // Favorite button should not be rendered
    const favButtons = renderer.root.findAll(
      (node) => node.props.accessibilityLabel?.includes('favoritos')
    );
    expect(favButtons.length).toBe(0);

    // Accessibility label should clearly indicate coming soon
    const pressable = renderer.root.find(
      (node) => node.props.accessibilityLabel && typeof node.props.accessibilityLabel === 'string'
    );
    expect(pressable.props.accessibilityLabel).toContain('Em breve: conteúdo ainda não publicado');
  });

  it('renders temporarily unavailable route with distinct badge and non-interactive accessibility', () => {
    let renderer!: TestRenderer.ReactTestRenderer;
    const onPressMock = jest.fn();

    act(() => {
      renderer = TestRenderer.create(
        <CompactRouteCard route={unavailableRoute} onPress={onPressMock} />
      );
    });

    const allTexts = renderer.root.findAllByType(Text).map((t) => t.props.children);
    expect(allTexts).toContain('Temporariamente indisponível');

    // Accessibility label should clearly indicate unavailable
    const pressable = renderer.root.find(
      (node) => node.props.accessibilityLabel && typeof node.props.accessibilityLabel === 'string'
    );
    expect(pressable.props.accessibilityLabel).toContain('Temporariamente indisponível para navegação');
  });

  it('calls onPress when an active card is pressed', () => {
    const onPressMock = jest.fn();
    let renderer!: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(<CompactRouteCard route={activeRoute} onPress={onPressMock} />);
    });

    const pressable = renderer.root.find(
      (node) => node.props.accessibilityRole === 'button' && typeof node.props.onPress === 'function'
    );
    expect(pressable).toBeDefined();

    act(() => {
      pressable.props.onPress();
    });
    expect(onPressMock).toHaveBeenCalledTimes(1);
  });

  it('calls onToggleFavorite when bookmark icon is pressed on active route', () => {
    const onToggleFavoriteMock = jest.fn();
    let renderer!: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(
        <CompactRouteCard
          route={activeRoute}
          isFavorite={false}
          onPress={jest.fn()}
          onToggleFavorite={onToggleFavoriteMock}
        />
      );
    });

    const favButton = renderer.root.find(
      (node) => node.props.accessibilityLabel === 'Salvar rota nos favoritos'
    );
    expect(favButton).toBeDefined();

    act(() => {
      favButton.props.onPress({ stopPropagation: jest.fn() });
    });
    expect(onToggleFavoriteMock).toHaveBeenCalledTimes(1);
  });
});
