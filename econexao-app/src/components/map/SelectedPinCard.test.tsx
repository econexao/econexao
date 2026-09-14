import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { Text, TouchableOpacity } from 'react-native';

import { SelectedPinCard } from './SelectedPinCard';

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

jest.mock('../common/GooglePlacePhoto', () => ({
  GooglePlacePhoto: () => null,
}));

describe('SelectedPinCard Component', () => {
  it('renders simple variant for mini-map without photo container', () => {
    let tree!: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(
        <SelectedPinCard
          actorId="actor-1"
          name="Pousada Vila de Alter"
          categorySlug="hospedagem"
          categoryLabel="Hospedagem"
          variant="simple"
          onPressAction={jest.fn()}
        />
      );
    });

    const root = tree.root;
    const textNodes = root.findAllByType(Text);
    const renderedTexts = textNodes.map((t) => t.props.children).flat();

    expect(renderedTexts).toContain('Pousada Vila de Alter');
    expect(renderedTexts).toContain('Hospedagem');
    expect(renderedTexts).toContain('Ver no mapa');
  });

  it('renders full variant with rating, status, and details action', () => {
    const onPress = jest.fn();
    let tree!: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(
        <SelectedPinCard
          actorId="actor-2"
          name="Restaurante Casa do Saulo"
          categorySlug="alimentacao"
          categoryLabel="Alimentação"
          variant="full"
          googleRating={4.8}
          ratingCount={350}
          statusText="Aberto agora"
          onPressAction={onPress}
        />
      );
    });

    const root = tree.root;
    const textNodes = root.findAllByType(Text);
    const renderedTexts = textNodes.map((t) => String(t.props.children));

    expect(renderedTexts.some((t) => t.includes('Restaurante Casa do Saulo'))).toBe(true);
    expect(renderedTexts.some((t) => t.includes('Alimentação'))).toBe(true);
    expect(renderedTexts.some((t) => t.includes('4.8'))).toBe(true);
    expect(renderedTexts.some((t) => t.includes('Aberto agora'))).toBe(true);

    const button = root.findByType(TouchableOpacity);
    act(() => {
      button.props.onPress();
    });
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
