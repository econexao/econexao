import React, { useMemo, useState } from 'react';
import { AccessibilityInfo, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { AppHeader } from '../../../src/components/common/AppHeader';
import { ErrorStateView, LoadingView } from '../../../src/components/common/UIStateViews';
import { useMyTripsQuery } from '../../../src/hooks/queries';
import { apiClient } from '../../../src/api/client';
import type { TripSchema } from '../../../src/api/types';
import { useAuth } from '../../../src/hooks/useAuth';
import { useAppTheme } from '../../../src/theme/theme';
import { makeAccessibleButton } from '../../../src/utils/accessibility';
import { MotionBlock } from '../../../src/components/common/MotionBlock';

type TripFilter = 'all' | 'active' | 'completed';
const FILTERS: { key: TripFilter; label: string }[] = [
  { key: 'all', label: 'Todas' },
  { key: 'active', label: 'Ativas' },
  { key: 'completed', label: 'Concluídas' },
];
const isCompleted = (trip: TripSchema) => trip.status === 'completed';

export default function TripsHistoryScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const { user } = useAuth();
  const tripsQuery = useMyTripsQuery(user?.id);
  const [filter, setFilter] = useState<TripFilter>('all');
  const [transitioningTripId, setTransitioningTripId] = useState<string | null>(null);
  const trips = tripsQuery.data ?? [];
  const counts = useMemo(() => ({
    all: trips.length,
    active: trips.filter((trip) => !isCompleted(trip)).length,
    completed: trips.filter(isCompleted).length,
  }), [trips]);
  const filteredTrips = useMemo(() => trips.filter((trip) => (
    filter === 'all' || (filter === 'completed' ? isCompleted(trip) : !isCompleted(trip))
  )), [filter, trips]);

  const handleTransition = async (tripId: string, action: 'pause' | 'resume' | 'finish') => {
    setTransitioningTripId(tripId);
    try {
      const result = action === 'pause'
        ? await apiClient.pauseTrip(tripId)
        : action === 'resume'
          ? await apiClient.resumeTrip(tripId)
          : await apiClient.finishTrip(tripId);
      await tripsQuery.refetch();
      const message = result.data.status === 'completed' ? 'Viagem concluída.' : result.data.status === 'paused' ? 'Viagem pausada.' : 'Viagem retomada.';
      AccessibilityInfo.announceForAccessibility(message);
    } catch {
      AccessibilityInfo.announceForAccessibility('Não foi possível atualizar a viagem. Tente novamente.');
      Alert.alert('Não foi possível atualizar', 'Verifique sua conexão e tente novamente.');
    } finally {
      setTransitioningTripId(null);
    }
  };

  const selectFilter = (nextFilter: TripFilter, label: string) => {
    setFilter(nextFilter);
    AccessibilityInfo.announceForAccessibility(`${label}: ${counts[nextFilter]} ${counts[nextFilter] === 1 ? 'viagem' : 'viagens'}.`);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surfaceBackground }]}>
      <AppHeader showBack fallbackHref="/(tabs)/(profile)" title="Histórico de viagens" />
      <ScrollView contentContainerStyle={styles.content}>
        <MotionBlock staggerIndex={0}>
        {!tripsQuery.isPending && !tripsQuery.isError && (
          <View accessibilityRole="tablist" style={styles.filtersRow}>
            {FILTERS.map((item) => {
              const selected = filter === item.key;
              return (
                <TouchableOpacity
                  key={item.key}
                  accessibilityRole="tab"
                  accessibilityState={{ selected }}
                  accessibilityLabel={`${item.label}, ${counts[item.key]}`}
                  onPress={() => selectFilter(item.key, item.label)}
                  style={[styles.filterChip, { backgroundColor: selected ? theme.colors.brandForest : theme.colors.surfaceContainerLow }]}
                >
                  <Text style={[styles.filterLabel, { color: selected ? theme.colors.onPrimary : theme.colors.onSurfaceVariant }]}>{item.label}</Text>
                  <View style={[styles.filterCount, { backgroundColor: selected ? 'rgba(255,255,255,0.2)' : 'transparent' }]}>
                    {item.key === 'active' && counts.active > 0
                      ? <View style={[styles.activeDot, { backgroundColor: theme.colors.secondaryContainer }]} />
                      : <Text style={[styles.filterCountText, { color: selected ? theme.colors.onPrimary : theme.colors.outline }]}>{counts[item.key]}</Text>}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {tripsQuery.isPending ? <LoadingView message="Carregando histórico de viagens..." /> : tripsQuery.isError ? (
          <ErrorStateView title="Erro ao carregar viagens" message="Não foi possível obter o histórico de viagens." onRetry={() => void tripsQuery.refetch()} />
        ) : (
          <>
            {filteredTrips.map((trip) => {
              const title = trip.route_title || 'Trilha / Rota Ecológica';
              const completed = isCompleted(trip);
              const paused = trip.status === 'paused';
              const hasRoute = Boolean(trip.route_id);
              const transitioning = transitioningTripId === trip.id;
              return (
                <View key={trip.id} style={[styles.tripCard, theme.shadows.card, { backgroundColor: theme.colors.surfaceWhite, borderColor: theme.isHighContrast ? theme.colors.brandForest : 'rgba(117,155,113,0.15)', borderWidth: theme.isHighContrast ? 2 : 1 }]}>
                  <TouchableOpacity disabled={!hasRoute} onPress={() => hasRoute && router.push(`/route/${trip.route_id}`)} style={styles.tripSummary} {...makeAccessibleButton(`Viagem ${title}`, hasRoute ? 'Toque para ver os detalhes da rota' : undefined)}>
                    <View style={[styles.routeIcon, { backgroundColor: theme.colors.brandForest }]}><Ionicons name={completed ? 'checkmark-circle-outline' : 'compass-outline'} size={27} color={theme.colors.onPrimary} /></View>
                    <View style={styles.tripIdentity}>
                      <Text numberOfLines={1} style={[styles.tripTitle, theme.typography.headlineSm, { color: theme.colors.onSurface }]}>{title}</Text>
                      <View style={styles.dateRow}>
                        <Ionicons name="calendar-outline" size={17} color={theme.colors.outline} />
                        <Text style={[theme.typography.bodyMd, { color: theme.colors.onSurfaceVariant }]}>Data:</Text>
                        <Text style={[theme.typography.bodyMd, styles.dateValue, { color: theme.colors.onSurfaceVariant }]}>{new Date(trip.created_at || Date.now()).toLocaleDateString('pt-BR')}</Text>
                      </View>
                    </View>
                    {hasRoute && <View style={[styles.chevron, { backgroundColor: theme.colors.surfaceContainer }]}><Ionicons name="chevron-forward" size={24} color={theme.colors.onSurfaceVariant} /></View>}
                  </TouchableOpacity>

                  <View style={[styles.statusPanel, { backgroundColor: theme.colors.surfaceContainerLow }]}>
                    <Text style={[theme.typography.bodyLg, { color: theme.colors.onSurfaceVariant }]}>Status:</Text>
                    <View style={[styles.statusPill, { backgroundColor: completed ? theme.colors.secondaryContainer : '#FCEDBE' }]}>
                      <View style={[styles.statusDot, { backgroundColor: completed ? theme.colors.brandLeaf : '#C98E00' }]} />
                      <Text style={[theme.typography.labelMd, styles.statusText, { color: completed ? theme.colors.brandForest : '#785900' }]}>{completed ? 'Concluída' : paused ? 'Pausada' : 'Em andamento'}</Text>
                    </View>
                  </View>

                  {!completed && (
                    <View style={styles.actionsRow}>
                      <TouchableOpacity style={[styles.actionButton, { backgroundColor: theme.colors.surfaceContainer }]} disabled={transitioning} onPress={() => void handleTransition(trip.id, paused ? 'resume' : 'pause')} {...makeAccessibleButton(paused ? 'Retomar viagem' : 'Pausar viagem')}>
                        <Ionicons name={paused ? 'play-circle-outline' : 'pause-circle-outline'} size={23} color={theme.colors.brandForest} />
                        <Text style={[styles.actionText, { color: theme.colors.brandForest }]}>{paused ? 'Retomar' : 'Pausar'}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.actionButton, theme.shadows.sm, { backgroundColor: theme.colors.brandForest }]} disabled={transitioning} onPress={() => void handleTransition(trip.id, 'finish')} {...makeAccessibleButton('Finalizar viagem')}>
                        <Ionicons name="checkmark-circle-outline" size={23} color={theme.colors.onPrimary} />
                        <Text style={[styles.actionText, { color: theme.colors.onPrimary }]}>Finalizar</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })}

            <View style={styles.historyEnd}>
              <View style={[styles.historyIcon, { backgroundColor: theme.colors.surfaceContainer }]}><Ionicons name="time-outline" size={31} color={theme.colors.outline} /></View>
              <Text style={[theme.typography.headlineSm, styles.historyTitle, { color: theme.colors.onSurface }]}>{filteredTrips.length ? 'Fim do histórico recente' : `Nenhuma viagem ${filter === 'active' ? 'ativa' : filter === 'completed' ? 'concluída' : 'registrada'}`}</Text>
              <Text style={[theme.typography.bodyMd, styles.historyMessage, { color: theme.colors.onSurfaceVariant }]}>{filteredTrips.length ? 'Você não possui outras viagens arquivadas neste perfil.' : filter === 'all' ? 'Você ainda não registrou nenhuma viagem ou visita em rotas ecológicas.' : 'Selecione outro filtro para consultar as demais viagens.'}</Text>
            </View>
          </>
        )}
        </MotionBlock>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 48, gap: 20 },
  filtersRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  filterChip: { minHeight: 44, paddingHorizontal: 16, borderRadius: 999, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  filterLabel: { fontSize: 16, lineHeight: 22 },
  filterCount: { minWidth: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  filterCountText: { fontSize: 12, lineHeight: 16 },
  activeDot: { width: 9, height: 9, borderRadius: 5 },
  tripCard: { borderRadius: 18, padding: 24, gap: 18 },
  tripSummary: { minHeight: 60, flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  routeIcon: { width: 60, height: 60, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  tripIdentity: { flex: 1, minWidth: 0, gap: 4 },
  tripTitle: { fontWeight: '700' },
  dateRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 4 },
  dateValue: { fontWeight: '700' },
  chevron: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  statusPanel: { minHeight: 62, borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  statusPill: { borderRadius: 999, paddingVertical: 5, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 7 },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { fontWeight: '700' },
  actionsRow: { flexDirection: 'row', gap: 14 },
  actionButton: { flex: 1, minHeight: 52, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  actionText: { fontSize: 16, lineHeight: 22, fontWeight: '600' },
  historyEnd: { alignItems: 'center', paddingHorizontal: 18, paddingTop: 30, paddingBottom: 36 },
  historyIcon: { width: 68, height: 68, borderRadius: 34, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  historyTitle: { textAlign: 'center', fontWeight: '700' },
  historyMessage: { textAlign: 'center', maxWidth: 380, marginTop: 6 },
});
