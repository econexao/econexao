import React from 'react';
import * as ReactNative from 'react-native';
import renderer, { act } from 'react-test-renderer';
import TabLayout from '../../app/(tabs)/_layout';

let capturedTabsProps: any = null;
const mockUseSafeAreaInsets = jest.fn();

jest.mock('react-native-safe-area-context', () => {
  const actual = jest.requireActual('react-native-safe-area-context');
  return {
    ...actual,
    useSafeAreaInsets: () => mockUseSafeAreaInsets(),
  };
});

jest.mock('expo-router', () => {
  const React = require('react');
  const { View } = require('react-native');

  const MockTabs = (props: any) => {
    capturedTabsProps = props;
    return React.createElement(View, props, props.children);
  };
  MockTabs.Screen = (props: any) => React.createElement(View, props);
  return {
    Tabs: MockTabs,
  };
});

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

describe('TabLayout safe area and layout test', () => {
  let originalPlatformOS: any;

  beforeEach(() => {
    capturedTabsProps = null;
    originalPlatformOS = ReactNative.Platform.OS;
    jest.clearAllMocks();
  });

  afterEach(() => {
    Object.defineProperty(ReactNative.Platform, 'OS', {
      value: originalPlatformOS,
      configurable: true,
    });
    jest.restoreAllMocks();
  });

  describe('Mobile Preservation (< 768px or native platforms)', () => {
    it('computes comfortable height (76px) and padding when bottom inset is 0 (desktop / web)', async () => {
      mockUseSafeAreaInsets.mockReturnValue({
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
      });

      await act(async () => {
        renderer.create(<TabLayout />);
      });

      expect(capturedTabsProps).not.toBeNull();
      const { screenOptions } = capturedTabsProps;
      expect(screenOptions.tabBarStyle.height).toBe(76);
      expect(screenOptions.tabBarStyle.paddingTop).toBe(6);
      expect(screenOptions.tabBarStyle.paddingBottom).toBe(10);
      expect(screenOptions.tabBarLabelStyle.fontSize).toBe(12);
      expect(screenOptions.tabBarLabelStyle.lineHeight).toBe(16);
    });

    it('dynamically expands height and padding when bottom inset is present (Android gesture bar / iOS)', async () => {
      mockUseSafeAreaInsets.mockReturnValue({
        top: 24,
        bottom: 24,
        left: 0,
        right: 0,
      });

      await act(async () => {
        renderer.create(<TabLayout />);
      });

      expect(capturedTabsProps).not.toBeNull();
      const { screenOptions } = capturedTabsProps;
      expect(screenOptions.tabBarStyle.height).toBe(100); // 76 + 24
      expect(screenOptions.tabBarStyle.paddingTop).toBe(6);
      expect(screenOptions.tabBarStyle.paddingBottom).toBe(24);
    });

    it('handles deep bottom inset such as iPhone home indicator (34px)', async () => {
      mockUseSafeAreaInsets.mockReturnValue({
        top: 44,
        bottom: 34,
        left: 0,
        right: 0,
      });

      await act(async () => {
        renderer.create(<TabLayout />);
      });

      expect(capturedTabsProps).not.toBeNull();
      const { screenOptions } = capturedTabsProps;
      expect(screenOptions.tabBarStyle.height).toBe(110); // 76 + 34
      expect(screenOptions.tabBarStyle.paddingTop).toBe(6);
      expect(screenOptions.tabBarStyle.paddingBottom).toBe(34);
    });

    it('preserves mobile tab bar style on mobile web viewports (< 768px)', async () => {
      Object.defineProperty(ReactNative.Platform, 'OS', {
        value: 'web',
        configurable: true,
      });
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
      mockUseSafeAreaInsets.mockReturnValue({
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
      });

      await act(async () => {
        renderer.create(<TabLayout />);
      });

      expect(capturedTabsProps).not.toBeNull();
      const { screenOptions } = capturedTabsProps;
      expect(screenOptions.tabBarStyle.height).toBe(76);
      expect(screenOptions.tabBarStyle.maxWidth).toBeUndefined();
      expect(screenOptions.tabBarStyle.borderRadius).toBeUndefined();
    });
  });

  describe('Desktop Web Floating Dock (width >= 768px, Platform.OS === web)', () => {
    beforeEach(() => {
      Object.defineProperty(ReactNative.Platform, 'OS', {
        value: 'web',
        configurable: true,
      });
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
      mockUseSafeAreaInsets.mockReturnValue({
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
      });
    });

    it('renders floating centered dock with maxWidth 540, borderRadius 24, height 68, and marginBottom 16', async () => {
      await act(async () => {
        renderer.create(<TabLayout />);
      });

      expect(capturedTabsProps).not.toBeNull();
      const { screenOptions } = capturedTabsProps;
      const tabBarStyle = screenOptions.tabBarStyle;

      expect(tabBarStyle.maxWidth).toBe(540);
      expect(tabBarStyle.width).toBe(540);
      expect(tabBarStyle.borderRadius).toBe(24);
      expect(tabBarStyle.height).toBe(68);
      expect(tabBarStyle.marginBottom).toBe(16);
      expect(tabBarStyle.borderWidth).toBe(1);
      expect(tabBarStyle.left).toBe('50%');
      expect(tabBarStyle.transform).toEqual([{ translateX: -270 }]);
      expect(screenOptions.tabBarButton).toBeDefined();
    });

    it('provides web tab button with pointer cursor, hover styling, focus outline, and click propagation', async () => {
      await act(async () => {
        renderer.create(<TabLayout />);
      });

      const { screenOptions } = capturedTabsProps;
      const TabButton = screenOptions.tabBarButton;
      expect(TabButton).toBeDefined();

      const mockOnPress = jest.fn();
      let buttonTree!: renderer.ReactTestRenderer;
      await act(async () => {
        buttonTree = renderer.create(
          <TabButton onPress={mockOnPress}>
            <ReactNative.Text>Tab Content</ReactNative.Text>
          </TabButton>
        );
      });

      const pressable = buttonTree.root.find(
        (node) => typeof node.props?.onHoverIn === 'function'
      );
      const initialStyle = ReactNative.StyleSheet.flatten(pressable.props.style);
      expect(initialStyle.cursor).toBe('pointer');

      // Test Hover In
      await act(async () => {
        pressable.props.onHoverIn?.({} as any);
      });
      const hoveredStyle = ReactNative.StyleSheet.flatten(pressable.props.style);
      expect(hoveredStyle.backgroundColor).toBe('rgba(51, 96, 30, 0.08)');

      // Test Hover Out
      await act(async () => {
        pressable.props.onHoverOut?.({} as any);
      });
      const unhoveredStyle = ReactNative.StyleSheet.flatten(pressable.props.style);
      expect(unhoveredStyle.backgroundColor).toBeUndefined();

      // Test Focus
      await act(async () => {
        pressable.props.onFocus?.({} as any);
      });
      const focusedStyle = ReactNative.StyleSheet.flatten(pressable.props.style);
      expect(focusedStyle.outlineWidth).toBe(2);
      expect(focusedStyle.outlineStyle).toBe('solid');

      // Test Blur
      await act(async () => {
        pressable.props.onBlur?.({} as any);
      });
      const blurredStyle = ReactNative.StyleSheet.flatten(pressable.props.style);
      expect(blurredStyle.outlineWidth).toBeUndefined();

      // Test Click / Press prevents default browser navigation and calls onPress
      const mockEventPreventDefault = jest.fn();
      await act(async () => {
        pressable.props.onPress?.({ preventDefault: mockEventPreventDefault } as any);
      });
      expect(mockEventPreventDefault).toHaveBeenCalledTimes(1);
      expect(mockOnPress).toHaveBeenCalledTimes(1);
    });
  });

  describe('TabPress Listeners Integrity', () => {
    it('keeps tabPress listeners intact for (explore), (routes), and (profile)', async () => {
      await act(async () => {
        renderer.create(<TabLayout />);
      });

      expect(capturedTabsProps).not.toBeNull();
      const screens = capturedTabsProps.children;
      expect(screens).toHaveLength(3);

      const mockNavigate = jest.fn();
      const mockPreventDefault = jest.fn();
      const mockNavigation = { navigate: mockNavigate } as any;

      // Test (explore) tab listener
      const exploreScreen = screens.find((s: any) => s.props.name === '(explore)');
      expect(exploreScreen).toBeDefined();
      const exploreListeners = exploreScreen.props.listeners({ navigation: mockNavigation });
      exploreListeners.tabPress({ preventDefault: mockPreventDefault });
      expect(mockPreventDefault).toHaveBeenCalledTimes(1);
      expect(mockNavigate).toHaveBeenCalledWith('(explore)', { screen: 'index' });

      // Test (routes) tab listener
      mockNavigate.mockClear();
      mockPreventDefault.mockClear();
      const routesScreen = screens.find((s: any) => s.props.name === '(routes)');
      expect(routesScreen).toBeDefined();
      const routesListeners = routesScreen.props.listeners({ navigation: mockNavigation });
      routesListeners.tabPress({ preventDefault: mockPreventDefault });
      expect(mockPreventDefault).toHaveBeenCalledTimes(1);
      expect(mockNavigate).toHaveBeenCalledWith('(routes)', { screen: 'index' });

      // Test (profile) tab listener
      mockNavigate.mockClear();
      mockPreventDefault.mockClear();
      const profileScreen = screens.find((s: any) => s.props.name === '(profile)');
      expect(profileScreen).toBeDefined();
      const profileListeners = profileScreen.props.listeners({ navigation: mockNavigation });
      profileListeners.tabPress({ preventDefault: mockPreventDefault });
      expect(mockPreventDefault).toHaveBeenCalledTimes(1);
      expect(mockNavigate).toHaveBeenCalledWith('(profile)', { screen: 'index' });
    });
  });
});

