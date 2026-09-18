import React from 'react';
import { Text } from 'react-native';
import TestRenderer, { act } from 'react-test-renderer';
import { CompactRouteCard } from './CompactRouteCard';
import type { RouteSummary } from '../../api/types';

jest.mock('@expo/vector-icons', () => ({
  Ionicons: () => null,
}));

describe('CompactRouteCard', () => {
  const sampleRoute: RouteSummary = {
    id: 'route-alter-do-chao',
    slug: 'rota-alter-do-chao',
    title: 'Praia do Amor (Alter do Chão)',
    summary: 'Praia do Amor e corredor de Alter do Chão.',
    city: 'Santarém',
    state_code: 'PA',
    status: 'active',
    is_verified: true,
    best_season: 'Período de seca e vazante do rio Tapajós',
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

  it('renders route title and location without best_season category text', () => {
    let renderer!: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(<CompactRouteCard route={sampleRoute} />);
    });

    const allTexts = renderer.root.findAllByType(Text).map((t) => t.props.children);
    expect(allTexts).toContain('Praia do Amor (Alter do Chão)');
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

    // Ensures the "Período de seca..." phrase does not appear on the card
    const hasBestSeason = allTexts.some((txt) =>
      typeof txt === 'string' && /período de seca/i.test(txt)
    );
    expect(hasBestSeason).toBe(false);
  });

  it('calls onPress when the card is pressed', () => {
    const onPressMock = jest.fn();
    let renderer!: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(<CompactRouteCard route={sampleRoute} onPress={onPressMock} />);
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

  it('calls onToggleFavorite when bookmark icon is pressed', () => {
    const onToggleFavoriteMock = jest.fn();
    let renderer!: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(
        <CompactRouteCard
          route={sampleRoute}
          isFavorite={false}
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
