import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
import renderer, { act } from 'react-test-renderer';

import { CategoryCarouselsCatalog } from './CategoryCarouselsCatalog';
import { CategoryCarouselSection } from './CategoryCarouselSection';
import type { ActorCategory, ActorSummary } from '../../api/types';

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

jest.mock('../common/GooglePlacePhoto', () => ({
  GooglePlacePhoto: () => null,
}));

describe('CategoryCarouselsCatalog', () => {
  const mockCategories: ActorCategory[] = [
    { id: 'cat-1', slug: 'alimentacao', label: 'Alimentação', icon: 'utensils', sort_order: 1 },
    { id: 'cat-2', slug: 'hospedagem', label: 'Hospedagem', icon: 'bed', sort_order: 2 },
    { id: 'cat-3', slug: 'artesanato', label: 'Artesanato', icon: 'palette', sort_order: 3 },
  ];

  const mockActors: ActorSummary[] = [
    {
      id: 'actor-1',
      slug: 'restaurante-zulu',
      name: 'Zulu Restaurante',
      category_slug: 'alimentacao',
      category_label: 'Alimentação',
      green_badge_status: 'verified',
      verification_status: 'verified',
      is_favorite: false,
    },
    {
      id: 'actor-2',
      slug: 'bar-alvorada',
      name: 'Alvorada Bar',
      category_slug: 'alimentacao',
      category_label: 'Alimentação',
      green_badge_status: 'none',
      verification_status: 'verified',
      is_favorite: false,
    },
    {
      id: 'actor-3',
      slug: 'pousada-encanto',
      name: 'Pousada Encanto',
      category_slug: 'hospedagem',
      category_label: 'Hospedagem',
      green_badge_status: 'none',
      verification_status: 'unverified',
      is_favorite: false,
    },
  ];

  it('groups actors into distinct category sections ordered by ADR 0010 canonical priority', () => {
    let tree!: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(
        <CategoryCarouselsCatalog
          actors={mockActors}
          categories={mockCategories}
          onSelectActor={jest.fn()}
        />
      );
    });

    const sections = tree.root.findAllByType(CategoryCarouselSection);
    expect(sections).toHaveLength(2);
    // ADR 0010 order: alimentacao (order: 1) then hospedagem (order: 3)
    expect(sections[0].props.categorySlug).toBe('alimentacao');
    expect(sections[0].props.actors).toHaveLength(2);
    expect(sections[1].props.categorySlug).toBe('hospedagem');
    expect(sections[1].props.actors).toHaveLength(1);
  });

  it('sorts alphabetically when A-Z toggle is selected', () => {
    let tree!: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(
        <CategoryCarouselsCatalog
          actors={mockActors}
          categories={mockCategories}
          onSelectActor={jest.fn()}
        />
      );
    });

    // In default order, Zulu is first as defined in mock
    let sections = tree.root.findAllByType(CategoryCarouselSection);
    expect(sections[0].props.actors[0].name).toBe('Zulu Restaurante');
    expect(sections[0].props.actors[1].name).toBe('Alvorada Bar');

    // Toggle A-Z
    const buttons = tree.root.findAllByType(TouchableOpacity);
    const azButton = buttons.find((b) => b.props.accessibilityLabel === 'Ordenar de A a Z');
    expect(azButton).toBeDefined();

    act(() => {
      azButton!.props.onPress();
    });

    sections = tree.root.findAllByType(CategoryCarouselSection);
    expect(sections[0].props.actors[0].name).toBe('Alvorada Bar');
    expect(sections[0].props.actors[1].name).toBe('Zulu Restaurante');
  });

  it('renders actors already filtered by the API category query', () => {
    let tree!: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(
        <CategoryCarouselsCatalog
          actors={[mockActors[2]]}
          categories={mockCategories}
          selectedCategory="hospedagem"
          onSelectActor={jest.fn()}
        />
      );
    });

    const sections = tree.root.findAllByType(CategoryCarouselSection);
    expect(sections).toHaveLength(1);
    expect(sections[0].props.categorySlug).toBe('hospedagem');
    expect(sections[0].props.actors[0].name).toBe('Pousada Encanto');
  });

  it('preserves API-filtered search results without refiltering them locally', () => {
    let tree!: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(
        <CategoryCarouselsCatalog
          actors={mockActors}
          categories={mockCategories}
          searchQuery="Alvorada"
          onSelectActor={jest.fn()}
        />
      );
    });

    const sections = tree.root.findAllByType(CategoryCarouselSection);
    expect(sections).toHaveLength(2);
    expect(sections[0].props.categorySlug).toBe('alimentacao');
    expect(sections[0].props.actors).toHaveLength(2);
    expect(sections[1].props.categorySlug).toBe('hospedagem');
  });

  it('represents sort selection with accessibilityState.selected, not disabled', () => {
    let tree!: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(
        <CategoryCarouselsCatalog
          actors={mockActors}
          categories={mockCategories}
          onSelectActor={jest.fn()}
        />
      );
    });

    let buttons = tree.root.findAllByType(TouchableOpacity);
    let relevance = buttons.find((b) => b.props.accessibilityLabel === 'Ordenar por relevância padrão');
    let alphabetical = buttons.find((b) => b.props.accessibilityLabel === 'Ordenar de A a Z');
    expect(relevance?.props.accessibilityState).toEqual({ selected: true });
    expect(relevance?.props.accessibilityState.disabled).not.toBe(true);
    expect(alphabetical?.props.accessibilityState).toEqual({ selected: false });

    act(() => alphabetical!.props.onPress());
    buttons = tree.root.findAllByType(TouchableOpacity);
    relevance = buttons.find((b) => b.props.accessibilityLabel === 'Ordenar por relevância padrão');
    alphabetical = buttons.find((b) => b.props.accessibilityLabel === 'Ordenar de A a Z');
    expect(relevance?.props.accessibilityState).toEqual({ selected: false });
    expect(alphabetical?.props.accessibilityState).toEqual({ selected: true });
  });
});
