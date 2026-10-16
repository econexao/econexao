import React from 'react';
import * as ReactNative from 'react-native';
import renderer, { act } from 'react-test-renderer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ProfileScreen from '../../../app/(tabs)/(profile)/index';

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn(),
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
  }),
}));

jest.mock('../../hooks/useApp', () => ({
  useApp: () => ({
    state: { activeRegionId: 'pindobal' },
    activeRegion: { id: 'pindobal', name: 'Pindobal' },
    openRegionSelector: jest.fn(),
  }),
}));

jest.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'user-1', email: 'teste@econexao.com.br', is_anonymous: false },
    signOut: jest.fn(),
  }),
}));

jest.mock('../../hooks/queries', () => ({
  useMyProfileQuery: () => ({
    data: {
      name: 'Viajante da Amazônia',
      location: 'Santarém, PA',
    },
    isPending: false,
    isError: false,
  }),
  useRegionsQuery: () => ({
    data: [{ id: 'pindobal', name: 'Pindobal', slug: 'pindobal' }],
    isSuccess: true,
    isPending: false,
    isError: false,
  }),
}));

describe('ProfileScreen Responsive Layout (Mobile 375px vs Desktop 1280px)', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: Infinity },
      },
    });
  });

  afterEach(() => {
    queryClient.clear();
    jest.restoreAllMocks();
  });

  it('renders 2-column menu grid (~48.8% width) on mobile viewports (375px)', async () => {
    jest.spyOn(ReactNative.Dimensions, 'get').mockReturnValue({
      width: 375,
      height: 812,
      scale: 2,
      fontScale: 1,
    } as any);
    jest.spyOn(ReactNative, 'useWindowDimensions').mockReturnValue({
      width: 375,
      height: 812,
      scale: 2,
      fontScale: 1,
    });

    let root: renderer.ReactTestRenderer;
    await act(async () => {
      root = renderer.create(
        <QueryClientProvider client={queryClient}>
          <ProfileScreen />
        </QueryClientProvider>
      );
    });

    const scrollView = root!.root.findByType(ReactNative.ScrollView);
    const scrollStyles = ReactNative.StyleSheet.flatten(scrollView.props.contentContainerStyle);
    expect(scrollStyles.maxWidth).toBeUndefined();

    // Verify 6 menu cards have 48.8% width on mobile using findAll predicate
    const menuCards = root!.root.findAllByType(ReactNative.TouchableOpacity).filter((el) => {
      const flat = ReactNative.StyleSheet.flatten(el.props?.style);
      return Boolean(flat && flat.width === '48.8%');
    });
    expect(menuCards.length).toBe(6);
  });

  it('renders centered 800px container and 3-column menu grid (~31.8% width) on desktop viewports (1280px)', async () => {
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

    let root: renderer.ReactTestRenderer;
    await act(async () => {
      root = renderer.create(
        <QueryClientProvider client={queryClient}>
          <ProfileScreen />
        </QueryClientProvider>
      );
    });

    const scrollView = root!.root.findByType(ReactNative.ScrollView);
    const scrollStyles = ReactNative.StyleSheet.flatten(scrollView.props.contentContainerStyle);
    expect(scrollStyles.maxWidth).toBe(800);
    expect(scrollStyles.alignSelf).toBe('center');

    // Verify 6 menu cards have 31.8% width on desktop
    const menuCards = root!.root.findAllByType(ReactNative.TouchableOpacity).filter((el) => {
      const flat = ReactNative.StyleSheet.flatten(el.props?.style);
      return Boolean(flat && flat.width === '31.8%');
    });
    expect(menuCards.length).toBe(6);

    // Verify bounded actions section
    const actionSections = root!.root.findAll((el) => {
      const flat = ReactNative.StyleSheet.flatten(el.props?.style);
      return Boolean(flat && flat.maxWidth === 480);
    });
    expect(actionSections.length).toBeGreaterThan(0);
  });
});
