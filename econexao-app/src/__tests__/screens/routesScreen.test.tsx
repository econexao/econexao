import React from 'react';
import * as ReactNative from 'react-native';
import renderer, { act } from 'react-test-renderer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import RoutesScreen from '../../../app/(tabs)/(routes)/index';

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
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
  }),
}));

jest.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'user-1' },
  }),
}));

const mockRouteData = [
  {
    id: 'route-1',
    name: 'Rota das Praias',
    city: 'Belterra',
    state_code: 'PA',
    description: 'Bela rota fluvial e de praias paradisíacas',
    is_verified: true,
    distance_meters: 15000,
    duration_seconds: 3600,
  },
  {
    id: 'route-2',
    name: 'Trilha das Florestas',
    city: 'Santarém',
    state_code: 'PA',
    description: 'Trilha imersiva na flora amazônica',
    is_verified: false,
    distance_meters: 8000,
    duration_seconds: 2400,
  },
  {
    id: 'route-3',
    name: 'Caminho do Tapajós',
    city: 'Alter do Chão',
    state_code: 'PA',
    description: 'Experiência gastronômica e cultural ribeirinha',
    is_verified: true,
    distance_meters: 5000,
    duration_seconds: 1800,
  },
];

jest.mock('../../hooks/queries', () => ({
  useRegionsQuery: () => ({
    data: [{ id: 'pindobal', name: 'Pindobal', slug: 'pindobal' }],
    isSuccess: true,
    isPending: false,
    isError: false,
  }),
  useInfiniteRoutesQuery: () => ({
    data: {
      pages: [
        {
          data: mockRouteData,
          has_more: true,
          page: 1,
        },
      ],
    },
    hasNextPage: true,
    isFetchingNextPage: false,
    fetchNextPage: jest.fn(),
    isPending: false,
    isError: false,
  }),
  useRoutesQuery: () => ({
    data: { data: [] },
    isSuccess: true,
    isPending: false,
    isError: false,
  }),
  flattenUniquePages: (pages: any) => pages?.[0]?.data ?? [],
  prefetchRouteData: jest.fn(),
  prefetchRouteDetailOnly: jest.fn(),
}));

jest.mock('../../hooks/useOptimisticFavoriteRoute', () => ({
  useOptimisticFavoriteRoute: () => ({
    toggleFavorite: jest.fn(),
    isPending: false,
  }),
}));

describe('RoutesScreen Responsive Layout (Mobile 375px vs Tablet 768px vs Desktop 1280px)', () => {
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

  it('renders 1 column full-width card layout for mobile viewports (375px)', async () => {
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
          <RoutesScreen />
        </QueryClientProvider>
      );
    });

    const scrollView = root!.root.findByType(ReactNative.ScrollView);
    const scrollStyles = ReactNative.StyleSheet.flatten(scrollView.props.contentContainerStyle);
    expect(scrollStyles.maxWidth).toBeUndefined();

    // Check card wrappers for 100% width on mobile using findAll predicate
    const cardWrappers = root!.root.findAll((el) => {
      const flat = ReactNative.StyleSheet.flatten(el.props?.style);
      return Boolean(flat && flat.width === '100%');
    });
    expect(cardWrappers.length).toBeGreaterThanOrEqual(mockRouteData.length);

    // loadMoreButton stretches on mobile
    const loadMoreButton = root!.root.findByProps({ accessibilityLabel: 'Carregar mais rotas' });
    const loadMoreStyles = ReactNative.StyleSheet.flatten(loadMoreButton.props.style);
    expect(loadMoreStyles.maxWidth).toBeUndefined();
  });

  it('renders 2 columns (~48% width) for tablet viewports (768px)', async () => {
    jest.spyOn(ReactNative.Dimensions, 'get').mockReturnValue({
      width: 768,
      height: 1024,
      scale: 1,
      fontScale: 1,
    } as any);
    jest.spyOn(ReactNative, 'useWindowDimensions').mockReturnValue({
      width: 768,
      height: 1024,
      scale: 1,
      fontScale: 1,
    });

    let root: renderer.ReactTestRenderer;
    await act(async () => {
      root = renderer.create(
        <QueryClientProvider client={queryClient}>
          <RoutesScreen />
        </QueryClientProvider>
      );
    });

    const scrollView = root!.root.findByType(ReactNative.ScrollView);
    const scrollStyles = ReactNative.StyleSheet.flatten(scrollView.props.contentContainerStyle);
    expect(scrollStyles.maxWidth).toBe(1200);

    const cardWrappers = root!.root.findAll((el) => {
      const flat = ReactNative.StyleSheet.flatten(el.props?.style);
      return Boolean(flat && flat.width === '48%');
    });
    expect(cardWrappers.length).toBeGreaterThanOrEqual(mockRouteData.length);

    const loadMoreButton = root!.root.findByProps({ accessibilityLabel: 'Carregar mais rotas' });
    const loadMoreStyles = ReactNative.StyleSheet.flatten(loadMoreButton.props.style);
    expect(loadMoreStyles.maxWidth).toBe(320);
    expect(loadMoreStyles.alignSelf).toBe('center');
  });

  it('renders 3 columns (~31.5% width) and centered 1200px container for desktop viewports (1280px)', async () => {
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
          <RoutesScreen />
        </QueryClientProvider>
      );
    });

    const scrollView = root!.root.findByType(ReactNative.ScrollView);
    const scrollStyles = ReactNative.StyleSheet.flatten(scrollView.props.contentContainerStyle);
    expect(scrollStyles.maxWidth).toBe(1200);
    expect(scrollStyles.alignSelf).toBe('center');

    const cardWrappers = root!.root.findAll((el) => {
      const flat = ReactNative.StyleSheet.flatten(el.props?.style);
      return Boolean(flat && flat.width === '31.5%');
    });
    expect(cardWrappers.length).toBeGreaterThanOrEqual(mockRouteData.length);

    const loadMoreButton = root!.root.findByProps({ accessibilityLabel: 'Carregar mais rotas' });
    const loadMoreStyles = ReactNative.StyleSheet.flatten(loadMoreButton.props.style);
    expect(loadMoreStyles.maxWidth).toBe(320);
    expect(loadMoreStyles.alignSelf).toBe('center');
  });
});
