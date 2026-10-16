import React from 'react';
import * as ReactNative from 'react-native';
import renderer, { act } from 'react-test-renderer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import RouteDetailScreen from '../../../app/route/[routeId]/index';

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
  }),
  useLocalSearchParams: () => ({
    routeId: 'route-test-1',
  }),
}));

jest.mock('../../components/routes/RouteMapPreview', () => {
  const { View } = require('react-native');
  return {
    RouteMapPreview: () => <View testID="mock-route-map-preview" />,
  };
});

jest.mock('../../components/routes/RouteGallery', () => {
  const { View } = require('react-native');
  return {
    RouteGallery: () => <View testID="mock-route-gallery" />,
  };
});

jest.mock('../../components/routes/LocalCatalogPreview', () => {
  const { View } = require('react-native');
  return {
    LocalCatalogPreview: () => <View testID="mock-local-catalog-preview" />,
  };
});

jest.mock('../../components/routes/TripStartModal', () => ({
  TripStartModal: () => null,
}));

const mockRouteDetail = {
  id: 'route-test-1',
  name: 'Rota do Pindobal',
  city: 'Belterra',
  state_code: 'PA',
  description: 'Uma linda praia de água doce no rio Tapajós',
  is_verified: true,
  origins: [
    { id: 'origin-1', name: 'Rodoviária de Santarém' },
  ],
};

jest.mock('../../hooks/useApp', () => ({
  useApp: () => ({
    state: { activeRegionId: 'pindobal' },
    activeRegion: { id: 'pindobal', name: 'Pindobal' },
    openRegionSelector: jest.fn(),
  }),
}));

jest.mock('../../hooks/queries', () => ({
  useRegionsQuery: () => ({
    data: [{ id: 'pindobal', name: 'Pindobal', slug: 'pindobal' }],
    isSuccess: true,
    isPending: false,
    isError: false,
  }),
  useRouteDetailQuery: () => ({
    data: mockRouteDetail,
    isPending: false,
    isError: false,
  }),
  useRouteAlertsQuery: () => ({
    data: [],
    isPending: false,
    isError: false,
  }),
}));

describe('RouteDetailScreen Responsive Layout (Mobile 375px vs Desktop 1280px)', () => {
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

  it('renders linear single column layout on mobile viewports (375px)', async () => {
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
          <RouteDetailScreen />
        </QueryClientProvider>
      );
    });

    const scrollView = root!.root.findByType(ReactNative.ScrollView);
    const scrollStyles = ReactNative.StyleSheet.flatten(scrollView.props.contentContainerStyle);
    expect(scrollStyles.maxWidth).toBe('100%');

    // Split view container should NOT exist on mobile
    const splitContainers = root!.root.findAll((el) => {
      const flat = ReactNative.StyleSheet.flatten(el.props?.style);
      return Boolean(flat && flat.flexDirection === 'row' && flat.gap === 32);
    });
    expect(splitContainers.length).toBe(0);
  });

  it('renders centered single column layout on tablet viewports (768px)', async () => {
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
          <RouteDetailScreen />
        </QueryClientProvider>
      );
    });

    const scrollView = root!.root.findByType(ReactNative.ScrollView);
    const scrollStyles = ReactNative.StyleSheet.flatten(scrollView.props.contentContainerStyle);
    expect(scrollStyles.maxWidth).toBe(760);
    expect(scrollStyles.alignSelf).toBe('center');

    // Split view container should NOT exist on tablet
    const splitContainers = root!.root.findAll((el) => {
      const flat = ReactNative.StyleSheet.flatten(el.props?.style);
      return Boolean(flat && flat.flexDirection === 'row' && flat.gap === 32);
    });
    expect(splitContainers.length).toBe(0);
  });

  it('renders 2-column Split View layout with left and right columns on desktop viewports (1280px)', async () => {
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
          <RouteDetailScreen />
        </QueryClientProvider>
      );
    });

    const scrollView = root!.root.findByType(ReactNative.ScrollView);
    const scrollStyles = ReactNative.StyleSheet.flatten(scrollView.props.contentContainerStyle);
    expect(scrollStyles.maxWidth).toBe(1200);
    expect(scrollStyles.alignSelf).toBe('center');

    // Split container exists with row layout and gap 32
    const splitContainers = root!.root.findAllByType(ReactNative.View).filter((el) => {
      const flat = ReactNative.StyleSheet.flatten(el.props?.style);
      return Boolean(flat && flat.flexDirection === 'row' && flat.gap === 32);
    });
    expect(splitContainers.length).toBe(1);

    // Left column with flex: 59
    const leftCols = root!.root.findAllByType(ReactNative.View).filter((el) => {
      const flat = ReactNative.StyleSheet.flatten(el.props?.style);
      return Boolean(flat && flat.flex === 59);
    });
    expect(leftCols.length).toBe(1);

    // Right column with flex: 41
    const rightCols = root!.root.findAllByType(ReactNative.View).filter((el) => {
      const flat = ReactNative.StyleSheet.flatten(el.props?.style);
      return Boolean(flat && flat.flex === 41);
    });
    expect(rightCols.length).toBe(1);
  });
});
