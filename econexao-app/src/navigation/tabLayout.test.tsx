import React from 'react';
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
  beforeEach(() => {
    capturedTabsProps = null;
    jest.clearAllMocks();
  });

  it('computes standard height and padding when bottom inset is 0 (desktop / standard)', async () => {
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
    expect(screenOptions.tabBarStyle.height).toBe(64);
    expect(screenOptions.tabBarStyle.paddingBottom).toBe(8);
    expect(screenOptions.tabBarStyle.paddingTop).toBe(8);
  });

  it('dynamically expands height and padding when bottom inset is present (Android gesture bar / iOS)', async () => {
    // 24px is typical Android gesture bar
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
    expect(screenOptions.tabBarStyle.height).toBe(88); // 64 + 24
    expect(screenOptions.tabBarStyle.paddingBottom).toBe(24);
    expect(screenOptions.tabBarStyle.paddingTop).toBe(8);
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
    expect(screenOptions.tabBarStyle.height).toBe(98); // 64 + 34
    expect(screenOptions.tabBarStyle.paddingBottom).toBe(34);
    expect(screenOptions.tabBarStyle.paddingTop).toBe(8);
    expect(screenOptions.tabBarItemStyle).toEqual({ paddingVertical: 2 });
  });
});
