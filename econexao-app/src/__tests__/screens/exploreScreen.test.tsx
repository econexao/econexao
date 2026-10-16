import React from 'react';
import * as ReactNative from 'react-native';
import renderer, { act } from 'react-test-renderer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import HomeScreen from '../../../app/(tabs)/(explore)/index';

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
  }),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 20, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('../../hooks/useApp', () => ({
  useApp: () => ({
    state: { activeRegionId: 'pindobal' },
    activeRegion: { id: 'pindobal', name: 'Pindobal' },
  }),
}));

jest.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'user-1' },
  }),
}));

jest.mock('../../hooks/queries', () => ({
  useRegionsQuery: () => ({
    data: [{ id: 'pindobal', name: 'Pindobal', slug: 'pindobal' }],
    isSuccess: true,
    isPending: false,
    isError: false,
  }),
  useRoutesQuery: () => ({
    data: { data: [] },
    isSuccess: true,
    isPending: false,
    isError: false,
  }),
  prefetchRouteData: jest.fn(),
  prefetchRouteDetailOnly: jest.fn(),
}));

jest.mock('../../hooks/useOptimisticFavoriteRoute', () => ({
  useOptimisticFavoriteRoute: () => ({
    toggleFavorite: jest.fn(),
    isPending: false,
  }),
}));

describe('HomeScreen Responsive Layout (Mobile 375px vs Desktop 1280px)', () => {
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

  it('renders mobile layout at 375px viewport with full-width elements and vertical hero controls', async () => {
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
          <HomeScreen />
        </QueryClientProvider>
      );
    });

    const scrollView = root!.root.findByType(ReactNative.ScrollView);
    const scrollStyles = ReactNative.StyleSheet.flatten(scrollView.props.contentContainerStyle);
    expect(scrollStyles.maxWidth).toBeUndefined();

    const ctaButton = root!.root.findByProps({ accessibilityLabel: 'Descobrir rotas' });
    const ctaStyles = ReactNative.StyleSheet.flatten(ctaButton.props.style);
    expect(ctaStyles.maxWidth).toBeUndefined();
    expect(ctaStyles.alignSelf).not.toBe('flex-start');
  });

  it('renders desktop layout at 1280px viewport with centered 1280px container, horizontal hero row, and bounded CTA', async () => {
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
          <HomeScreen />
        </QueryClientProvider>
      );
    });

    const scrollView = root!.root.findByType(ReactNative.ScrollView);
    const scrollStyles = ReactNative.StyleSheet.flatten(scrollView.props.contentContainerStyle);
    expect(scrollStyles.maxWidth).toBe(1280);
    expect(scrollStyles.alignSelf).toBe('center');
    expect(scrollStyles.paddingHorizontal).toBe(32);

    const ctaButton = root!.root.findByProps({ accessibilityLabel: 'Descobrir rotas' });
    const ctaStyles = ReactNative.StyleSheet.flatten(ctaButton.props.style);
    expect(ctaStyles.maxWidth).toBe(320);

    // State wrapper check (for centered empty state card when no routes)
    const stateWrappers = root!.root.findAll((el) => {
      const flat = ReactNative.StyleSheet.flatten(el.props?.style);
      return Boolean(flat && flat.maxWidth === 800 && flat.padding === 28);
    });
    expect(stateWrappers.length).toBeGreaterThan(0);
    const stateWrapperStyles = ReactNative.StyleSheet.flatten(stateWrappers[0].props.style);
    expect(stateWrapperStyles.maxWidth).toBe(800);
    expect(stateWrapperStyles.alignSelf).toBe('center');
    expect(stateWrapperStyles.backgroundColor).toBe('#FFFFFF');
  });
});
