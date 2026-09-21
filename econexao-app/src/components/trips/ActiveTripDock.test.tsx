import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AccessibilityInfo, Text, TouchableOpacity } from 'react-native';
import { ActiveTripDock } from './ActiveTripDock';
import { AuthContext } from '../../auth/AuthProvider';
import { apiClient } from '../../api/client';
import { queryKeys } from '../../api/queryKeys';
import type { TripSchema } from '../../api/types';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
    back: jest.fn(),
  }),
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

describe('ActiveTripDock Component', () => {
  let queryClient: QueryClient;
  const mockUser = { id: 'user-123', email: 'test@example.com' };
  const mockAuthContext = {
    status: 'authenticated' as const,
    user: mockUser as any,
    profile: null,
    isGuest: false,
    isAdmin: false,
    session: null,
    error: null,
    signInWithGoogle: jest.fn(),
    signInWithApple: jest.fn(),
    signInAnonymously: jest.fn(),
    signOut: jest.fn(),
    refreshProfile: jest.fn(),
    retry: jest.fn(),
  };

  const sampleActiveTrip: TripSchema = {
    id: 'trip-abc',
    user_id: 'user-123',
    route_id: 'route-pedral',
    status: 'active',
    route_title: 'Trilha Pedral do Lourenço',
    created_at: '2026-09-21T10:00:00Z',
    started_at: '2026-09-21T10:00:00Z',
  };

  const samplePausedTrip: TripSchema = {
    id: 'trip-def',
    user_id: 'user-123',
    route_id: 'route-pedral',
    status: 'paused',
    route_title: 'Trilha Pedral do Lourenço',
    created_at: '2026-09-21T10:00:00Z',
    started_at: '2026-09-21T10:00:00Z',
  };

  const sampleCompletedTrip: TripSchema = {
    id: 'trip-ghi',
    user_id: 'user-123',
    route_id: 'route-pedral',
    status: 'completed',
    route_title: 'Trilha Pedral do Lourenço',
    created_at: '2026-09-21T10:00:00Z',
    started_at: '2026-09-21T10:00:00Z',
    completed_at: '2026-09-21T12:00:00Z',
  };

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: 0,
        },
      },
    });
    jest.clearAllMocks();
    jest.spyOn(AccessibilityInfo, 'announceForAccessibility').mockImplementation(() => {});
  });

  const renderComponent = (trips: TripSchema[] = []) => {
    queryClient.setQueryData(queryKeys.myTrips(mockUser.id), {
      data: trips,
    });

    let tree: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(
        <AuthContext.Provider value={mockAuthContext as any}>
          <QueryClientProvider client={queryClient}>
            <ActiveTripDock />
          </QueryClientProvider>
        </AuthContext.Provider>
      );
    });

    return tree!;
  };

  it('renders null when there are no active or paused trips', () => {
    const tree = renderComponent([sampleCompletedTrip]);
    expect(tree.toJSON()).toBeNull();
  });

  it('renders active trip dock with route title and "Em andamento" status', () => {
    const tree = renderComponent([sampleActiveTrip]);
    const textNodes = tree.root.findAllByType(Text);
    const strings = textNodes.map((n) => n.props.children).flat();

    expect(strings).toContain('SUA VIAGEM');
    expect(strings).toContain('Trilha Pedral do Lourenço');
    expect(strings).toContain('Em andamento');
  });

  it('renders paused trip dock with "Pausada" status', () => {
    const tree = renderComponent([samplePausedTrip]);
    const textNodes = tree.root.findAllByType(Text);
    const strings = textNodes.map((n) => n.props.children).flat();

    expect(strings).toContain('Pausada');
  });

  it('handles quick pause action when active', async () => {
    const pauseSpy = jest.spyOn(apiClient, 'pauseTrip').mockResolvedValueOnce({
      data: { ...sampleActiveTrip, status: 'paused' },
    } as any);

    const tree = renderComponent([sampleActiveTrip]);

    const buttons = tree.root.findAllByType(TouchableOpacity);
    const quickPauseBtn = buttons.find(
      (b) => b.props.accessibilityLabel && b.props.accessibilityLabel.includes('Pausar viagem')
    );

    expect(quickPauseBtn).toBeDefined();

    await act(async () => {
      await quickPauseBtn!.props.onPress();
    });

    expect(pauseSpy).toHaveBeenCalledWith('trip-abc');
    expect(AccessibilityInfo.announceForAccessibility).toHaveBeenCalledWith('Viagem pausada.');
  });

  it('handles quick resume action when paused', async () => {
    const resumeSpy = jest.spyOn(apiClient, 'resumeTrip').mockResolvedValueOnce({
      data: { ...samplePausedTrip, status: 'active' },
    } as any);

    const tree = renderComponent([samplePausedTrip]);

    const buttons = tree.root.findAllByType(TouchableOpacity);
    const quickResumeBtn = buttons.find(
      (b) => b.props.accessibilityLabel && b.props.accessibilityLabel.includes('Retomar viagem')
    );

    expect(quickResumeBtn).toBeDefined();

    await act(async () => {
      await quickResumeBtn!.props.onPress();
    });

    expect(resumeSpy).toHaveBeenCalledWith('trip-def');
    expect(AccessibilityInfo.announceForAccessibility).toHaveBeenCalledWith('Viagem retomada.');
  });

  it('opens controls modal on tap and allows finishing the trip', async () => {
    const finishSpy = jest.spyOn(apiClient, 'finishTrip').mockResolvedValueOnce({
      data: { ...sampleActiveTrip, status: 'completed' },
    } as any);

    const tree = renderComponent([sampleActiveTrip]);

    const mainDockArea = tree.root.findAllByType(TouchableOpacity).find(
      (b) => b.props.accessibilityHint === 'Toque para abrir os controles da viagem'
    );
    expect(mainDockArea).toBeDefined();

    await act(async () => {
      mainDockArea!.props.onPress();
    });

    const finishButton = tree.root.findAllByType(TouchableOpacity).find(
      (b) => b.props.accessibilityLabel && b.props.accessibilityLabel.includes('Finalizar viagem')
    );
    expect(finishButton).toBeDefined();

    await act(async () => {
      await finishButton!.props.onPress();
    });

    expect(finishSpy).toHaveBeenCalledWith('trip-abc');
    expect(AccessibilityInfo.announceForAccessibility).toHaveBeenCalledWith('Viagem concluída com sucesso!');
  });

  it('allows navigating to route details from the modal', async () => {
    const tree = renderComponent([sampleActiveTrip]);

    const mainDockArea = tree.root.findAllByType(TouchableOpacity).find(
      (b) => b.props.accessibilityHint === 'Toque para abrir os controles da viagem'
    );
    expect(mainDockArea).toBeDefined();

    await act(async () => {
      mainDockArea!.props.onPress();
    });

    const routeDetailsBtn = tree.root.findAllByType(TouchableOpacity).find(
      (b) => b.props.accessibilityLabel && b.props.accessibilityLabel.includes('Ver detalhes da rota')
    );
    expect(routeDetailsBtn).toBeDefined();

    await act(async () => {
      routeDetailsBtn!.props.onPress();
    });

    expect(mockPush).toHaveBeenCalledWith('/route/route-pedral');
  });
});
