import React from 'react';
import { ScrollView, Text, TouchableOpacity } from 'react-native';
import renderer, { act } from 'react-test-renderer';

import { CategoryCarouselSection } from './CategoryCarouselSection';
import { ActorCard } from './ActorCard';
import type { ActorSummary } from '../../api/types';

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

jest.mock('../common/GooglePlacePhoto', () => ({
  GooglePlacePhoto: () => null,
}));

describe('CategoryCarouselSection', () => {
  const mockActors: ActorSummary[] = [
    {
      id: 'actor-1',
      slug: 'hotel-pindobal',
      name: 'Hotel Pindobal',
      category_slug: 'hospedagem',
      category_label: 'Hospedagem',
      address: 'Praia do Pindobal',
      latitude: -2.5,
      longitude: -54.9,
      green_badge_status: 'verified',
      verification_status: 'verified',
      google_rating: 4.9,
      is_favorite: false,
    },
    {
      id: 'actor-2',
      slug: 'pousada-sol',
      name: 'Pousada do Sol',
      category_slug: 'hospedagem',
      category_label: 'Hospedagem',
      address: 'Praia do Pindobal, 2',
      latitude: -2.51,
      longitude: -54.91,
      green_badge_status: 'none',
      verification_status: 'verified',
      google_rating: 4.7,
      is_favorite: false,
    },
  ];

  it('renders category header with label and total count', () => {
    let tree!: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(
        <CategoryCarouselSection
          categorySlug="hospedagem"
          categoryLabel="Hospedagem"
          actors={mockActors}
          onSelectActor={jest.fn()}
        />
      );
    });

    const texts = tree.root.findAllByType(Text).map((t) => (Array.isArray(t.props.children) ? t.props.children.join('') : t.props.children));
    expect(texts).toContain('Hospedagem');
    expect(texts).toContain('2 estabelecimentos');
  });

  it('renders cards for each actor inside the horizontal scroll view', () => {
    let tree!: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(
        <CategoryCarouselSection
          categorySlug="hospedagem"
          categoryLabel="Hospedagem"
          actors={mockActors}
          onSelectActor={jest.fn()}
        />
      );
    });

    const cards = tree.root.findAllByType(ActorCard);
    expect(cards).toHaveLength(2);
    expect(cards[0].props.actor.name).toBe('Hotel Pindobal');
    expect(cards[1].props.actor.name).toBe('Pousada do Sol');
  });

  it('provides accessible navigation buttons for carousel scrolling without drag', () => {
    let tree!: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(
        <CategoryCarouselSection
          categorySlug="hospedagem"
          categoryLabel="Hospedagem"
          actors={mockActors}
          onSelectActor={jest.fn()}
        />
      );
    });

    const buttons = tree.root.findAllByType(TouchableOpacity);
    const prevBtn = buttons.find((b) => b.props.accessibilityLabel === 'Anterior em Hospedagem');
    const nextBtn = buttons.find((b) => b.props.accessibilityLabel === 'Próximo em Hospedagem');

    expect(prevBtn).toBeDefined();
    expect(nextBtn).toBeDefined();
  });

  it('renders loading, error and empty states honestly', () => {
    let loadingTree!: renderer.ReactTestRenderer;
    act(() => {
      loadingTree = renderer.create(
        <CategoryCarouselSection
          categorySlug="hospedagem"
          categoryLabel="Hospedagem"
          actors={[]}
          isLoading
          onSelectActor={jest.fn()}
        />
      );
    });
    const loadingTexts = loadingTree.root.findAllByType(Text).map((t) => (Array.isArray(t.props.children) ? t.props.children.join('') : t.props.children));
    expect(loadingTexts).toContain('Carregando hospedagem...');

    let errorTree!: renderer.ReactTestRenderer;
    const retryFn = jest.fn();
    act(() => {
      errorTree = renderer.create(
        <CategoryCarouselSection
          categorySlug="hospedagem"
          categoryLabel="Hospedagem"
          actors={[]}
          isError
          onRetry={retryFn}
          onSelectActor={jest.fn()}
        />
      );
    });
    expect(errorTree.root.findAllByType(Text).map((t) => t.props.children)).toContain(
      'Não foi possível carregar esta categoria.'
    );

    let emptyTree!: renderer.ReactTestRenderer;
    act(() => {
      emptyTree = renderer.create(
        <CategoryCarouselSection
          categorySlug="hospedagem"
          categoryLabel="Hospedagem"
          actors={[]}
          onSelectActor={jest.fn()}
        />
      );
    });
    const emptyTexts = emptyTree.root
      .findAllByType(Text)
      .map((t) => (Array.isArray(t.props.children) ? t.props.children.join('') : t.props.children));
    expect(emptyTexts).toContain('Nenhum estabelecimento encontrado em Hospedagem.');
  });
});
