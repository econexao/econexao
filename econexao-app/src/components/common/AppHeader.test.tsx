import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { TouchableOpacity, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { AppHeader } from './AppHeader';

const mockBack = jest.fn();
const mockReplace = jest.fn();
const mockCanGoBack = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    back: mockBack,
    replace: mockReplace,
    canGoBack: mockCanGoBack,
  }),
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

let mockAppState: { activeRegionId: string | null } = { activeRegionId: 'reg-1' };

jest.mock('../../hooks/useApp', () => ({
  useApp: () => ({
    state: mockAppState,
    activeRegion: { id: 'reg-1', name: 'Santarém & Belterra' },
    setActiveRegion: jest.fn(),
    openRegionSelector: jest.fn(),
    closeRegionSelector: jest.fn(),
  }),
}));

jest.mock('../../hooks/queries', () => ({
  useRegionsQuery: () => ({
    data: [{ id: 'reg-1', name: 'Santarém & Belterra' }],
  }),
}));

describe('AppHeader navigation and fallback', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCanGoBack.mockReturnValue(true);
  });

  it('renders default brand title without back button when showBack is false', async () => {
    let tree!: renderer.ReactTestRenderer;
    await act(async () => {
      tree = renderer.create(<AppHeader title="ECOnexão" showBack={false} />);
    });
    const root = tree.root;
    const texts = root.findAllByType(Text).map((t) => t.props.children);
    expect(texts).toContain('ECOnexão');

    // Only the region chip button should be present
    const buttons = root.findAllByType(TouchableOpacity);
    expect(buttons.length).toBe(1);
  });

  it('calls custom onBackPress when provided', async () => {
    const customBack = jest.fn();
    let tree!: renderer.ReactTestRenderer;
    await act(async () => {
      tree = renderer.create(
        <AppHeader title="Minha Rota" showBack={true} onBackPress={customBack} />
      );
    });
    const root = tree.root;
    const buttons = root.findAllByType(TouchableOpacity);
    expect(buttons.length).toBe(2);

    // Press back button
    await act(async () => {
      buttons[0].props.onPress();
    });

    expect(customBack).toHaveBeenCalledTimes(1);
    expect(mockBack).not.toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('calls router.back() when onBackPress is not provided and canGoBack() is true', async () => {
    mockCanGoBack.mockReturnValue(true);
    let tree!: renderer.ReactTestRenderer;
    await act(async () => {
      tree = renderer.create(<AppHeader title="Minha Rota" showBack={true} />);
    });
    const root = tree.root;
    const buttons = root.findAllByType(TouchableOpacity);

    await act(async () => {
      buttons[0].props.onPress();
    });

    expect(mockBack).toHaveBeenCalledTimes(1);
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('calls router.replace(fallbackHref) when onBackPress is not provided and canGoBack() is false', async () => {
    mockCanGoBack.mockReturnValue(false);
    let tree!: renderer.ReactTestRenderer;
    await act(async () => {
      tree = renderer.create(
        <AppHeader title="Minha Rota" showBack={true} fallbackHref="/route/pindobal" />
      );
    });
    const root = tree.root;
    const buttons = root.findAllByType(TouchableOpacity);

    await act(async () => {
      buttons[0].props.onPress();
    });

    expect(mockBack).not.toHaveBeenCalled();
    expect(mockReplace).toHaveBeenCalledWith('/route/pindobal');
  });

  it('falls back to /(tabs)/(routes) when canGoBack() is false and fallbackHref is omitted', async () => {
    mockCanGoBack.mockReturnValue(false);
    let tree!: renderer.ReactTestRenderer;
    await act(async () => {
      tree = renderer.create(<AppHeader title="Minha Rota" showBack={true} />);
    });
    const root = tree.root;
    const buttons = root.findAllByType(TouchableOpacity);

    await act(async () => {
      buttons[0].props.onPress();
    });

    expect(mockBack).not.toHaveBeenCalled();
    expect(mockReplace).toHaveBeenCalledWith('/(tabs)/(routes)');
  });

  it('renders "Todas as regiões" when activeRegionId is null', async () => {
    mockAppState = { activeRegionId: null };
    let tree!: renderer.ReactTestRenderer;
    await act(async () => {
      tree = renderer.create(<AppHeader title="ECOnexão" showBack={false} />);
    });
    const root = tree.root;
    const texts = root.findAllByType(Text).map((t) => t.props.children);
    expect(texts).toContain('Todas as regiões');
  });

  it('renders specific region name when activeRegionId matches a region', async () => {
    mockAppState = { activeRegionId: 'reg-1' };
    let tree!: renderer.ReactTestRenderer;
    await act(async () => {
      tree = renderer.create(<AppHeader title="ECOnexão" showBack={false} />);
    });
    const root = tree.root;
    const texts = root.findAllByType(Text).map((t) => t.props.children);
    expect(texts).toContain('Santarém & Belterra');
  });
});
