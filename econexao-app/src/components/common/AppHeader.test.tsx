import React from 'react';
import renderer, { act } from 'react-test-renderer';
import * as ReactNative from 'react-native';
import { TouchableOpacity, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { AppHeader } from './AppHeader';
import { theme } from '../../theme/theme';

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
    expect(texts).toContain('Região do Tapajós (Santarém)');
  });
});

describe('AppHeader desktop responsive constraints & affordances', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('preserves mobile layout (<768px) with compact region chip (maxWidth: 180) and unconstrained container', async () => {
    jest.spyOn(ReactNative.Dimensions, 'get').mockReturnValue({
      width: 375,
      height: 812,
      scale: 1,
      fontScale: 1,
    } as any);
    jest.spyOn(ReactNative, 'useWindowDimensions').mockReturnValue({
      width: 375,
      height: 812,
      scale: 1,
      fontScale: 1,
    });

    let tree!: renderer.ReactTestRenderer;
    await act(async () => {
      tree = renderer.create(<AppHeader title="ECOnexão" showBack={true} />);
    });

    const root = tree.root;
    const innerContainer = root.findAllByType(ReactNative.View).find((v) => {
      const flat = ReactNative.StyleSheet.flatten(v.props.style);
      return flat && flat.justifyContent === 'space-between' && flat.alignItems === 'center';
    });
    expect(innerContainer).toBeDefined();
    const innerStyle = ReactNative.StyleSheet.flatten(innerContainer!.props.style);
    expect(innerStyle.maxWidth).toBeUndefined();
    expect(innerStyle.paddingHorizontal).toBe(16);

    const buttons = root.findAllByType(ReactNative.TouchableOpacity);
    const regionButton = buttons[buttons.length - 1];
    const regionStyle = ReactNative.StyleSheet.flatten(regionButton.props.style);
    expect(regionStyle.maxWidth).toBe(180);
  });

  it('renders centered 1200px container and expanded region chip (maxWidth: 280) on desktop (1280px)', async () => {
    jest.spyOn(ReactNative.Dimensions, 'get').mockReturnValue({
      width: 1280,
      height: 800,
      scale: 1,
      fontScale: 1,
    } as any);
    jest.spyOn(ReactNative, 'useWindowDimensions').mockReturnValue({
      width: 1280,
      height: 800,
      scale: 1,
      fontScale: 1,
    });

    let tree!: renderer.ReactTestRenderer;
    await act(async () => {
      tree = renderer.create(<AppHeader title="ECOnexão" showBack={true} />);
    });

    const root = tree.root;
    const innerContainer = root.findAllByType(ReactNative.View).find((v) => {
      const flat = ReactNative.StyleSheet.flatten(v.props.style);
      return flat && flat.maxWidth === 1200;
    });
    expect(innerContainer).toBeDefined();
    const innerStyle = ReactNative.StyleSheet.flatten(innerContainer!.props.style);
    expect(innerStyle.maxWidth).toBe(1200);
    expect(innerStyle.alignSelf).toBe('center');

    const buttons = root.findAllByType(ReactNative.TouchableOpacity);
    const regionButton = buttons[buttons.length - 1];
    const regionStyle = ReactNative.StyleSheet.flatten(regionButton.props.style);
    expect(regionStyle.maxWidth).toBe(280);
  });

  it('toggles hover background highlight on back button and region chip', async () => {
    let tree!: renderer.ReactTestRenderer;
    await act(async () => {
      tree = renderer.create(<AppHeader title="Minha Rota" showBack={true} />);
    });

    const root = tree.root;
    const buttons = root.findAllByType(ReactNative.TouchableOpacity);
    const backButton = buttons[0];
    const regionButton = buttons[1];

    await act(async () => {
      backButton.props.onMouseEnter();
    });
    let backStyle = ReactNative.StyleSheet.flatten(backButton.props.style);
    expect(backStyle.backgroundColor).toBe('rgba(51, 96, 30, 0.08)');

    await act(async () => {
      backButton.props.onMouseLeave();
    });
    backStyle = ReactNative.StyleSheet.flatten(backButton.props.style);
    expect(backStyle.backgroundColor).toBeUndefined();

    await act(async () => {
      regionButton.props.onMouseEnter();
    });
    let regionStyle = ReactNative.StyleSheet.flatten(regionButton.props.style);
    expect(regionStyle.backgroundColor).toBe('rgba(51, 96, 30, 0.08)');

    await act(async () => {
      regionButton.props.onMouseLeave();
    });
    regionStyle = ReactNative.StyleSheet.flatten(regionButton.props.style);
    expect(regionStyle.backgroundColor).toBe(theme.colors.surfaceContainerLow);
  });

  it('applies keyboard focus outline on back button and region chip upon focus and removes on blur', async () => {
    let tree!: renderer.ReactTestRenderer;
    await act(async () => {
      tree = renderer.create(<AppHeader title="Minha Rota" showBack={true} />);
    });

    const root = tree.root;
    const buttons = root.findAllByType(ReactNative.TouchableOpacity);
    const backButton = buttons[0];
    const regionButton = buttons[1];

    await act(async () => {
      backButton.props.onFocus();
    });
    let backStyle = ReactNative.StyleSheet.flatten(backButton.props.style);
    expect(backStyle.borderColor).toBe(theme.colors.brandForest);

    await act(async () => {
      backButton.props.onBlur();
    });
    backStyle = ReactNative.StyleSheet.flatten(backButton.props.style);
    expect(backStyle.borderColor).toBe('transparent');

    await act(async () => {
      regionButton.props.onFocus();
    });
    let regionStyle = ReactNative.StyleSheet.flatten(regionButton.props.style);
    expect(regionStyle.borderColor).toBe(theme.colors.brandForest);
    expect(regionStyle.borderWidth).toBe(1.5);

    await act(async () => {
      regionButton.props.onBlur();
    });
    regionStyle = ReactNative.StyleSheet.flatten(regionButton.props.style);
    expect(regionStyle.borderColor).toBe('rgba(117, 155, 113, 0.2)');
  });

  it('applies translucent overlay styling when overlayOnImage={true}', async () => {
    let tree!: renderer.ReactTestRenderer;
    await act(async () => {
      tree = renderer.create(
        <AppHeader title="Rota Tapajós" showBack={true} overlayOnImage={true} />
      );
    });

    const root = tree.root;
    const buttons = root.findAllByType(ReactNative.TouchableOpacity);
    const backButton = buttons[0];
    const regionButton = buttons[1];

    const regionStyle = ReactNative.StyleSheet.flatten(regionButton.props.style);
    expect(regionStyle.backgroundColor).toBe('rgba(18, 43, 28, 0.72)');

    await act(async () => {
      backButton.props.onMouseEnter();
    });
    const backHovered = ReactNative.StyleSheet.flatten(backButton.props.style);
    expect(backHovered.backgroundColor).toBe('rgba(255, 255, 255, 0.16)');

    await act(async () => {
      regionButton.props.onFocus();
    });
    const regionFocused = ReactNative.StyleSheet.flatten(regionButton.props.style);
    expect(regionFocused.borderColor).toBe(theme.colors.surfaceWhite);
  });
});

