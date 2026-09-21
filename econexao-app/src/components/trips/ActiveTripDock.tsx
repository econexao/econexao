import React, { useContext, useMemo, useState } from 'react';
import {
  AccessibilityInfo,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../../auth/AuthProvider';
import { useMyTripsQuery } from '../../hooks/queries';
import { apiClient } from '../../api/client';
import { queryKeys } from '../../api/queryKeys';
import type { TripSchema } from '../../api/types';
import { useAppTheme } from '../../theme/theme';
import { makeAccessibleButton } from '../../utils/accessibility';
import { ActiveTripControlsModal } from './ActiveTripControlsModal';

export const isTripActiveOrPaused = (trip: TripSchema) => trip.status !== 'completed';

interface ActiveTripDockContentProps {
  userId: string;
}

const ActiveTripDockContent: React.FC<ActiveTripDockContentProps> = ({ userId }) => {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const tripsQuery = useMyTripsQuery(userId);

  const [modalVisible, setModalVisible] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const activeTrip = useMemo(() => {
    const trips = tripsQuery.data ?? [];
    return trips.find(isTripActiveOrPaused) ?? null;
  }, [tripsQuery.data]);

  if (!activeTrip) {
    return null;
  }

  const isPaused = activeTrip.status === 'paused';
  const routeTitle = activeTrip.route_title || 'Trilha / Rota Ecológica';
  const bottomOffset = 76 + insets.bottom + 12;

  const handleTransition = async (action: 'pause' | 'resume' | 'finish') => {
    setIsTransitioning(true);
    try {
      const result =
        action === 'pause'
          ? await apiClient.pauseTrip(activeTrip.id)
          : action === 'resume'
          ? await apiClient.resumeTrip(activeTrip.id)
          : await apiClient.finishTrip(activeTrip.id);

      if (userId) {
        await queryClient.invalidateQueries({ queryKey: queryKeys.myTrips(userId) });
      }

      const nextStatus = result.data.status;
      const message =
        nextStatus === 'completed'
          ? 'Viagem concluída com sucesso!'
          : nextStatus === 'paused'
          ? 'Viagem pausada.'
          : 'Viagem retomada.';

      AccessibilityInfo.announceForAccessibility(message);

      if (nextStatus === 'completed') {
        setModalVisible(false);
      }
    } catch {
      AccessibilityInfo.announceForAccessibility('Não foi possível atualizar o status da viagem.');
      Alert.alert('Erro ao atualizar viagem', 'Verifique sua conexão e tente novamente.');
    } finally {
      setIsTransitioning(false);
    }
  };

  return (
    <>
      <View
        pointerEvents="box-none"
        style={[
          styles.container,
          {
            bottom: bottomOffset,
          },
        ]}
      >
        <View
          style={[
            styles.dockWrapper,
            theme.shadows.card,
            {
              backgroundColor: theme.colors.surfaceWhite,
              borderColor: theme.isHighContrast ? theme.colors.brandForest : 'rgba(51, 96, 30, 0.2)',
              borderWidth: theme.isHighContrast ? 2 : 1,
            },
          ]}
        >
          {/* Main Clickable Area to open controls */}
          <TouchableOpacity
            style={styles.contentArea}
            onPress={() => setModalVisible(true)}
            {...makeAccessibleButton(
              `Sua viagem: ${routeTitle}. Status: ${isPaused ? 'Pausada' : 'Em andamento'}`,
              'Toque para abrir os controles da viagem'
            )}
          >
            <View
              style={[
                styles.iconBadge,
                { backgroundColor: isPaused ? '#FCEDBE' : 'rgba(51, 96, 30, 0.12)' },
              ]}
            >
              <Ionicons
                name={isPaused ? 'pause-circle' : 'compass'}
                size={22}
                color={isPaused ? '#C98E00' : theme.colors.brandForest}
              />
            </View>

            <View style={styles.textWrap}>
              <View style={styles.titleRow}>
                <Text style={[styles.sectionTag, { color: theme.colors.brandForest }]}>
                  SUA VIAGEM
                </Text>
                <View
                  style={[
                    styles.statusPill,
                    { backgroundColor: isPaused ? '#FCEDBE' : theme.colors.secondaryContainer },
                  ]}
                >
                  <View
                    style={[
                      styles.statusDot,
                      { backgroundColor: isPaused ? '#C98E00' : theme.colors.brandLeaf },
                    ]}
                  />
                  <Text
                    style={[
                      styles.statusPillText,
                      { color: isPaused ? '#785900' : theme.colors.brandForest },
                    ]}
                  >
                    {isPaused ? 'Pausada' : 'Em andamento'}
                  </Text>
                </View>
              </View>

              <Text
                numberOfLines={1}
                style={[styles.routeName, { color: theme.colors.onSurface }]}
              >
                {routeTitle}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Quick Action Button: Pause / Resume */}
          <TouchableOpacity
            style={[
              styles.quickActionButton,
              {
                backgroundColor: isPaused ? theme.colors.brandForest : theme.colors.surfaceContainer,
              },
            ]}
            disabled={isTransitioning}
            onPress={() => handleTransition(isPaused ? 'resume' : 'pause')}
            {...makeAccessibleButton(
              isPaused ? 'Retomar viagem' : 'Pausar viagem',
              isPaused ? 'Retoma o registro da viagem' : 'Pausa temporariamente a viagem'
            )}
          >
            <Ionicons
              name={isPaused ? 'play' : 'pause'}
              size={18}
              color={isPaused ? theme.colors.onPrimary : theme.colors.brandForest}
            />
          </TouchableOpacity>
        </View>
      </View>

      <ActiveTripControlsModal
        visible={modalVisible}
        trip={activeTrip}
        onClose={() => setModalVisible(false)}
        onTransition={handleTransition}
        isTransitioning={isTransitioning}
      />
    </>
  );
};

export const ActiveTripDock: React.FC = () => {
  const auth = useContext(AuthContext);
  const userId = auth?.user?.id;

  if (!userId) {
    return null;
  }

  return <ActiveTripDockContent userId={userId} />;
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    alignItems: 'center',
    zIndex: 999,
  },
  dockWrapper: {
    width: '100%',
    maxWidth: 540,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 10,
  },
  contentArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 44,
  },
  iconBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    flex: 1,
    gap: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTag: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  routeName: {
    fontSize: 14,
    fontWeight: '700',
  },
  quickActionButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
