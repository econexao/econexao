import React from 'react';
import { Text } from 'react-native';
import TestRenderer, { act } from 'react-test-renderer';
import { RouteCard } from './RouteCard';
import type { RouteSummary } from '../../api/types';

jest.mock('@expo/vector-icons', () => ({
  Ionicons: () => null,
}));

describe('RouteCard', () => {
  const activeRoute: RouteSummary = {
    id: 'd437d9db-e5be-465b-9f8a-07ce64229305',
    slug: 'rota-pindobal',
    title: 'Pindobal',
    summary: 'Praia do Pindobal e orla do Rio Tapajós.',
    city: 'Belterra',
    state_code: 'PA',
    status: 'active',
    is_verified: true,
    best_season: null,
    cover_image_url: null,
    cover_media: null,
    is_favorite: false,
  };

  const previewRoute: RouteSummary = {
    id: 'preview-route-vila-socorro',
    slug: 'rota-vila-socorro',
    title: 'Vila Socorro',
    summary: 'Comunidade tradicional e ecoturismo.',
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
    id: 'route-maintenance-2',
    slug: 'rota-fechada',
    title: 'Cachoeira do Acará',
    summary: 'Acesso em manutenção.',
    city: 'Altamira',
    state_code: 'PA',
    status: 'inactive',
    is_verified: false,
    best_season: null,
    cover_image_url: null,
    cover_media: null,
    is_favorite: false,
  };

  it('renders active route with verified badge, interactive button role, and favorite action', () => {
    let renderer!: TestRenderer.ReactTestRenderer;
    const onPressMock = jest.fn();
    const onToggleFavoriteMock = jest.fn();

    act(() => {
      renderer = TestRenderer.create(
        <RouteCard
          route={activeRoute}
          onPress={onPressMock}
          onToggleFavorite={onToggleFavoriteMock}
        />
      );
    });

    const allTexts = renderer.root.findAllByType(Text).map((t) => t.props.children);
    expect(allTexts).toContain('Pindobal');
    expect(allTexts).toContain('Belterra, PA');
    expect(allTexts).toContain('Verificada');

    const buttonNode = renderer.root.find(
      (node) =>
        node.props.accessibilityRole === 'button' &&
        typeof node.props.onPress === 'function' &&
        node.props.accessibilityLabel?.startsWith('Rota Pindobal')
    );
    expect(buttonNode).toBeDefined();

    act(() => {
      buttonNode.props.onPress();
    });
    expect(onPressMock).toHaveBeenCalledTimes(1);

    const favButton = renderer.root.find(
      (node) => node.props.accessibilityLabel === 'Salvar rota nos favoritos'
    );
    expect(favButton).toBeDefined();

    act(() => {
      favButton.props.onPress({ stopPropagation: jest.fn() });
    });
    expect(onToggleFavoriteMock).toHaveBeenCalledTimes(1);
  });

  it('renders preview route with Em breve badge and non-interactive accessibility', () => {
    let renderer!: TestRenderer.ReactTestRenderer;
    const onPressMock = jest.fn();
    const onToggleFavoriteMock = jest.fn();

    act(() => {
      renderer = TestRenderer.create(
        <RouteCard
          route={previewRoute}
          onPress={onPressMock}
          onToggleFavorite={onToggleFavoriteMock}
        />
      );
    });

    const allTexts = renderer.root.findAllByType(Text).map((t) => t.props.children);
    expect(allTexts).toContain('Em breve');

    const buttonNodes = renderer.root.findAll(
      (node) => node.props.accessibilityRole === 'button'
    );
    expect(buttonNodes.length).toBe(0);

    const favButtons = renderer.root.findAll(
      (node) => node.props.accessibilityLabel?.includes('favoritos')
    );
    expect(favButtons.length).toBe(0);

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
        <RouteCard route={unavailableRoute} onPress={onPressMock} />
      );
    });

    const allTexts = renderer.root.findAllByType(Text).map((t) => t.props.children);
    expect(allTexts).toContain('Temporariamente indisponível');

    const pressable = renderer.root.find(
      (node) => node.props.accessibilityLabel && typeof node.props.accessibilityLabel === 'string'
    );
    expect(pressable.props.accessibilityLabel).toContain('Temporariamente indisponível para navegação');
  });
});
