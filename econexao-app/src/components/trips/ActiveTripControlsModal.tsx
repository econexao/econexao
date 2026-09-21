import React, { useRef } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAppTheme } from '../../theme/theme';
import { makeAccessibleButton } from '../../utils/accessibility';
import { AccessibleModal } from '../common/AccessibleModal';
import type { TripSchema } from '../../api/types';

export interface ActiveTripControlsModalProps {
  visible: boolean;
  trip: TripSchema | null;
  onClose: () => void;
  onTransition: (action: 'pause' | 'resume' | 'finish') => Promise<void>;
  isTransitioning?: boolean;
  returnFocusRef?: React.RefObject<any>;
}

export const ActiveTripControlsModal: React.FC<ActiveTripControlsModalProps> = ({
  visible,
  trip,
  onClose,
  onTransition,
  isTransitioning = false,
  returnFocusRef,
}) => {
  const router = useRouter();
  const theme = useAppTheme();
  const modalTitleRef = useRef<any>(null);

  if (!trip) return null;

  const isPaused = trip.status === 'paused';
  const routeTitle = trip.route_title || 'Trilha / Rota Ecológica';
  const hasRoute = Boolean(trip.route_id);

  const handleNavigateToRoute = () => {
    onClose();
    if (trip.route_id) {
      router.push(`/route/${trip.route_id}`);
    }
  };

  const handleNavigateToMap = () => {
    onClose();
    if (trip.route_id) {
      router.push(`/route/${trip.route_id}/map`);
    }
  };

  return (
    <AccessibleModal
      visible={visible}
      transparent
      animationType="fade"
      onClose={onClose}
      initialFocusRef={modalTitleRef}
      returnFocusRef={returnFocusRef}
      accessibilityLabel="Controles da viagem em andamento"
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.dialogCard,
            {
              backgroundColor: theme.colors.surfaceWhite,
              borderColor: theme.isHighContrast ? theme.colors.brandForest : 'transparent',
              borderWidth: theme.isHighContrast ? 2 : 0,
            },
          ]}
          accessible
          accessibilityLabel="Gerenciar viagem em andamento"
        >
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.headerRow}>
              <View style={[styles.iconBadge, { backgroundColor: isPaused ? '#FCEDBE' : 'rgba(51, 96, 30, 0.12)' }]}>
                <Ionicons
                  name={isPaused ? 'pause-circle' : 'compass'}
                  size={28}
                  color={isPaused ? '#C98E00' : theme.colors.brandForest}
                />
              </View>
              <View style={styles.headerTextWrap}>
                <Text
                  ref={modalTitleRef}
                  style={[styles.title, { color: theme.colors.onSurface }]}
                  accessibilityRole="header"
                >
                  Sua Viagem
                </Text>
                <Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]} numberOfLines={2}>
                  {routeTitle}
                </Text>
              </View>
            </View>

            {/* Status Pill */}
            <View style={[styles.statusRow, { backgroundColor: theme.colors.surfaceContainerLow }]}>
              <Text style={[styles.statusLabel, { color: theme.colors.onSurfaceVariant }]}>Status da viagem:</Text>
              <View style={[styles.statusBadge, { backgroundColor: isPaused ? '#FCEDBE' : theme.colors.secondaryContainer }]}>
                <View style={[styles.statusDot, { backgroundColor: isPaused ? '#C98E00' : theme.colors.brandLeaf }]} />
                <Text style={[styles.statusBadgeText, { color: isPaused ? '#785900' : theme.colors.brandForest }]}>
                  {isPaused ? 'Pausada' : 'Em andamento'}
                </Text>
              </View>
            </View>

            {/* Info Message */}
            <View style={[styles.infoCard, { backgroundColor: 'rgba(51, 96, 30, 0.08)' }]}>
              <Ionicons name="information-circle-outline" size={20} color={theme.colors.brandForest} />
              <Text style={[styles.infoCardText, { color: theme.colors.brandForest }]}>
                {isPaused
                  ? 'A viagem está pausada. Retome quando estiver pronto para continuar seu trajeto.'
                  : 'Sua viagem está ativa. Pause para descansar ou finalize ao completar seu passeio.'}
              </Text>
            </View>

            {/* Action Buttons */}
            <View style={styles.buttonStack}>
              {/* Toggle Pause / Resume */}
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  { backgroundColor: isPaused ? theme.colors.brandForest : theme.colors.surfaceContainer },
                  isTransitioning && styles.disabledButton,
                ]}
                disabled={isTransitioning}
                onPress={() => onTransition(isPaused ? 'resume' : 'pause')}
                {...makeAccessibleButton(
                  isPaused ? 'Retomar viagem' : 'Pausar viagem',
                  isPaused ? 'Retoma o registro da viagem ativa' : 'Pausa temporariamente a viagem'
                )}
              >
                {isTransitioning ? (
                  <ActivityIndicator size="small" color={isPaused ? theme.colors.onPrimary : theme.colors.brandForest} />
                ) : (
                  <>
                    <Ionicons
                      name={isPaused ? 'play-circle-outline' : 'pause-circle-outline'}
                      size={22}
                      color={isPaused ? theme.colors.onPrimary : theme.colors.brandForest}
                    />
                    <Text
                      style={[
                        styles.actionButtonText,
                        { color: isPaused ? theme.colors.onPrimary : theme.colors.brandForest },
                      ]}
                    >
                      {isPaused ? 'Retomar Viagem' : 'Pausar Viagem'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Finish Trip */}
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  styles.finishButton,
                  { backgroundColor: theme.colors.brandForest },
                  isTransitioning && styles.disabledButton,
                ]}
                disabled={isTransitioning}
                onPress={() => onTransition('finish')}
                {...makeAccessibleButton('Finalizar viagem', 'Conclui e arquiva a viagem no seu histórico')}
              >
                {isTransitioning ? (
                  <ActivityIndicator size="small" color={theme.colors.onPrimary} />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle-outline" size={22} color={theme.colors.onPrimary} />
                    <Text style={[styles.actionButtonText, { color: theme.colors.onPrimary }]}>
                      Finalizar Viagem
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              {/* View Route & Map */}
              {hasRoute && (
                <View style={styles.navRow}>
                  <TouchableOpacity
                    style={[styles.secondaryButton, { borderColor: theme.colors.surfaceContainerHigh }]}
                    onPress={handleNavigateToRoute}
                    {...makeAccessibleButton('Ver detalhes da rota', 'Abre a página com informações completas da rota')}
                  >
                    <Ionicons name="document-text-outline" size={18} color={theme.colors.brandForest} />
                    <Text style={[styles.secondaryButtonText, { color: theme.colors.brandForest }]}>
                      Detalhes da Rota
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.secondaryButton, { borderColor: theme.colors.surfaceContainerHigh }]}
                    onPress={handleNavigateToMap}
                    {...makeAccessibleButton('Abrir mapa da rota', 'Abre o mapa interativo desta rota')}
                  >
                    <Ionicons name="map-outline" size={18} color={theme.colors.brandForest} />
                    <Text style={[styles.secondaryButtonText, { color: theme.colors.brandForest }]}>
                      Mapa da Rota
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Close Button */}
              <TouchableOpacity
                style={styles.closeButton}
                onPress={onClose}
                disabled={isTransitioning}
                {...makeAccessibleButton('Fechar controles', 'Fecha esta janela de controles da viagem')}
              >
                <Text style={[styles.closeButtonText, { color: theme.colors.onSurfaceVariant }]}>Fechar</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </AccessibleModal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  dialogCard: {
    width: '100%',
    maxWidth: 480,
    maxHeight: '90%',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8,
    overflow: 'hidden',
  },
  scrollContent: {
    padding: 24,
    gap: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  iconBadge: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextWrap: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 2,
    fontWeight: '500',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  statusLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusBadgeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 12,
  },
  infoCardText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  buttonStack: {
    gap: 10,
    marginTop: 4,
  },
  actionButton: {
    minHeight: 48,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
  },
  finishButton: {
    minHeight: 48,
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
  disabledButton: {
    opacity: 0.6,
  },
  navRow: {
    flexDirection: 'row',
    gap: 10,
  },
  secondaryButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 10,
  },
  secondaryButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  closeButton: {
    minHeight: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  closeButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
