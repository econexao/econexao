import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { TouchableOpacity, Text, Modal, AccessibilityInfo } from 'react-native';
import { OriginSelector, findDefaultOrigin, getOriginIconAndLabel } from './OriginSelector';

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

const mockOrigins = [
  {
    id: 'origin-porto',
    route_id: 'route-1',
    code: 'porto',
    name: 'Porto Fluvial',
    description: 'Ponto de partida no porto',
    distance_m: 12000,
    duration_s: 900,
    actor_count: 5,
  },
  {
    id: 'origin-aeroporto',
    route_id: 'route-1',
    code: 'aeroporto',
    name: 'Aeroporto',
    description: 'Ponto de partida no aeroporto',
    distance_m: 35000,
    duration_s: 2400,
    actor_count: 8,
  },
  {
    id: 'origin-rodoviaria',
    route_id: 'route-1',
    code: 'rodoviaria',
    name: 'Rodoviária',
    description: 'Ponto de partida na rodoviária',
    distance_m: 28000,
    duration_s: 1800,
    actor_count: 6,
  },
];

describe('OriginSelector Component (Simplified Dropdown)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(AccessibilityInfo, 'announceForAccessibility');
  });

  it('renders null when origins array is empty or undefined', () => {
    const onSelectOrigin = jest.fn();
    let rootEmpty: renderer.ReactTestRenderer;
    act(() => {
      rootEmpty = renderer.create(
        <OriginSelector origins={[]} onSelectOrigin={onSelectOrigin} />
      );
    });
    expect(rootEmpty!.toJSON()).toBeNull();

    let rootUndefined: renderer.ReactTestRenderer;
    act(() => {
      rootUndefined = renderer.create(
        <OriginSelector origins={undefined as any} onSelectOrigin={onSelectOrigin} />
      );
    });
    expect(rootUndefined!.toJSON()).toBeNull();
  });

  it('renders the compact "saindo de:" label and defaults to Rodoviária when selectedOriginId is not specified', () => {
    const onSelectOrigin = jest.fn();
    let root: renderer.ReactTestRenderer;

    act(() => {
      root = renderer.create(
        <OriginSelector origins={mockOrigins} onSelectOrigin={onSelectOrigin} />
      );
    });

    // Check label
    const allTexts = root!.root.findAllByType(Text);
    const labelText = allTexts.find((t) => t.props.children === 'saindo de:');
    expect(labelText).toBeDefined();

    // Check selected text defaults to Rodoviária
    const selectedText = allTexts.find((t) => t.props.children === 'Rodoviária');
    expect(selectedText).toBeDefined();

    // Check trigger button accessibility
    const trigger = root!.root.findAllByType(TouchableOpacity).find(
      (b) => b.props.accessibilityRole === 'combobox'
    );
    expect(trigger).toBeDefined();
    expect(trigger?.props.accessibilityLabel).toBe('Saindo de: Rodoviária');
    expect(trigger?.props.accessibilityState).toEqual({ expanded: false });
  });

  it('renders the specified selectedOriginId when provided', () => {
    const onSelectOrigin = jest.fn();
    let root: renderer.ReactTestRenderer;

    act(() => {
      root = renderer.create(
        <OriginSelector
          origins={mockOrigins}
          selectedOriginId="origin-porto"
          onSelectOrigin={onSelectOrigin}
        />
      );
    });

    const trigger = root!.root.findAllByType(TouchableOpacity).find(
      (b) => b.props.accessibilityRole === 'combobox'
    );
    expect(trigger?.props.accessibilityLabel).toBe('Saindo de: Porto');
  });

  it('does NOT render "Minha localização", "Escolher no mapa" or big distance detail card', () => {
    const onSelectOrigin = jest.fn();
    let root: renderer.ReactTestRenderer;

    act(() => {
      root = renderer.create(
        <OriginSelector
          origins={mockOrigins}
          selectedOriginId="origin-porto"
          onSelectOrigin={onSelectOrigin}
          enableDynamicRouting={true}
        />
      );
    });

    const buttons = root!.root.findAllByType(TouchableOpacity);
    const gpsButton = buttons.find(
      (b) => b.props.accessibilityLabel === 'Usar minha localização atual como origem'
    );
    expect(gpsButton).toBeUndefined();

    const mapButton = buttons.find(
      (b) => b.props.accessibilityLabel === 'Escolher ponto de partida no mapa'
    );
    expect(mapButton).toBeUndefined();

    // No distance card text
    const allTexts = root!.root.findAllByType(Text);
    const distanceText = allTexts.find(
      (t) => typeof t.props.children === 'string' && t.props.children.includes('Distância total:')
    );
    expect(distanceText).toBeUndefined();
  });

  it('opens modal on trigger click and displays all origins', () => {
    const onSelectOrigin = jest.fn();
    let root: renderer.ReactTestRenderer;

    act(() => {
      root = renderer.create(
        <OriginSelector origins={mockOrigins} onSelectOrigin={onSelectOrigin} />
      );
    });

    const modalBefore = root!.root.findByType(Modal);
    expect(modalBefore.props.visible).toBe(false);

    const trigger = root!.root.findAllByType(TouchableOpacity).find(
      (b) => b.props.accessibilityRole === 'combobox'
    );

    act(() => {
      trigger?.props.onPress();
    });

    const modalAfter = root!.root.findByType(Modal);
    expect(modalAfter.props.visible).toBe(true);

    // Check menu items
    const menuItems = root!.root.findAllByType(TouchableOpacity).filter(
      (b) => b.props.accessibilityRole === 'menuitem'
    );
    expect(menuItems.length).toBe(3);
    expect(menuItems[0].props.accessibilityLabel).toBe('Selecionar Porto');
    expect(menuItems[1].props.accessibilityLabel).toBe('Selecionar Aeroporto');
    expect(menuItems[2].props.accessibilityLabel).toBe('Selecionar Rodoviária');
  });

  it('selecting an origin invokes onSelectOrigin, announces to accessibility and closes modal', () => {
    const onSelectOrigin = jest.fn();
    let root: renderer.ReactTestRenderer;

    act(() => {
      root = renderer.create(
        <OriginSelector origins={mockOrigins} onSelectOrigin={onSelectOrigin} />
      );
    });

    const trigger = root!.root.findAllByType(TouchableOpacity).find(
      (b) => b.props.accessibilityRole === 'combobox'
    );

    act(() => {
      trigger?.props.onPress();
    });

    const portoOption = root!.root.findAllByType(TouchableOpacity).find(
      (b) => b.props.accessibilityLabel === 'Selecionar Porto'
    );

    act(() => {
      portoOption?.props.onPress();
    });

    expect(onSelectOrigin).toHaveBeenCalledWith('origin-porto');
    expect(AccessibilityInfo.announceForAccessibility).toHaveBeenCalledWith(
      'Origem selecionada: Porto'
    );

    const modalAfter = root!.root.findByType(Modal);
    expect(modalAfter.props.visible).toBe(false);
  });

  it('closes modal when touching backdrop', () => {
    const onSelectOrigin = jest.fn();
    let root: renderer.ReactTestRenderer;

    act(() => {
      root = renderer.create(
        <OriginSelector origins={mockOrigins} onSelectOrigin={onSelectOrigin} />
      );
    });

    const trigger = root!.root.findAllByType(TouchableOpacity).find(
      (b) => b.props.accessibilityRole === 'combobox'
    );

    act(() => {
      trigger?.props.onPress();
    });

    expect(root!.root.findByType(Modal).props.visible).toBe(true);

    const backdrop = root!.root.findAllByType(TouchableOpacity).find(
      (b) => b.props.accessibilityLabel === 'Fechar opções de ponto de partida'
    );

    act(() => {
      backdrop?.props.onPress();
    });

    expect(root!.root.findByType(Modal).props.visible).toBe(false);
  });

  describe('findDefaultOrigin helper', () => {
    it('returns Rodoviária if present', () => {
      const def = findDefaultOrigin(mockOrigins);
      expect(def?.id).toBe('origin-rodoviaria');
    });

    it('falls back to origins[0] if Rodoviária is not present', () => {
      const originsWithoutRodoviaria = [mockOrigins[0], mockOrigins[1]];
      const def = findDefaultOrigin(originsWithoutRodoviaria);
      expect(def?.id).toBe('origin-porto');
    });

    it('returns undefined if origins array is empty', () => {
      expect(findDefaultOrigin([])).toBeUndefined();
    });
  });

  describe('getOriginIconAndLabel helper', () => {
    it('assigns bus icon for rodoviária', () => {
      const res = getOriginIconAndLabel({ id: '1', name: 'Rodoviária Central' });
      expect(res.iconName).toBe('bus-outline');
      expect(res.shortName).toBe('Rodoviária');
    });

    it('assigns boat icon for porto', () => {
      const res = getOriginIconAndLabel({ id: '2', name: 'Porto Hidroviário' });
      expect(res.iconName).toBe('boat-outline');
      expect(res.shortName).toBe('Porto');
    });

    it('assigns airplane icon for aeroporto', () => {
      const res = getOriginIconAndLabel({ id: '3', name: 'Aeroporto Internacional' });
      expect(res.iconName).toBe('airplane-outline');
      expect(res.shortName).toBe('Aeroporto');
    });

    it('assigns default location icon for other names', () => {
      const res = getOriginIconAndLabel({ id: '4', name: 'Praça Central' });
      expect(res.iconName).toBe('location-outline');
      expect(res.shortName).toBe('Praça Central');
    });
  });
});
