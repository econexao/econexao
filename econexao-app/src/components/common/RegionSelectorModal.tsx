import React, { useRef, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  AccessibilityInfo,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';
import { useApp } from '../../hooks/useApp';
import { AuthContext } from '../../auth/AuthProvider';
import { useRegionsQuery } from '../../hooks/queries';
import { apiClient } from '../../api/client';
import { makeAccessibleButton } from '../../utils/accessibility';
import { setStoredVisitorRegion } from '../../utils/regionStorage';
import { AccessibleModal } from './AccessibleModal';
import type { Region } from '../../api/types';

interface RegionSelectorModalProps {
  visible: boolean;
  onClose: () => void;
  returnFocusRef?: React.RefObject<any>;
}

export const RegionSelectorModal: React.FC<RegionSelectorModalProps> = ({
  visible,
  onClose,
  returnFocusRef,
}) => {
  const { state, dispatch } = useApp();
  const auth = useContext(AuthContext);
  const user = auth?.user;
  const regionsQuery = useRegionsQuery();
  const closeButtonRef = useRef<React.ElementRef<typeof TouchableOpacity>>(null);

  const isAllSelected = !state.activeRegionId || state.activeRegionId === 'all';

  const handleSelectRegion = async (region: Region | null) => {
    const regionId = region?.id ?? null;
    dispatch({ type: 'SET_ACTIVE_REGION', payload: regionId });
    await setStoredVisitorRegion(regionId);
    onClose();

    const announceMsg = region
      ? `Região alterada para ${region.name}`
      : 'Região alterada para Todas as regiões';
    AccessibilityInfo.announceForAccessibility(announceMsg);

    if (user?.id) {
      try {
        await apiClient.updateMyPreferences({ active_region_id: regionId });
      } catch {
        AccessibilityInfo.announceForAccessibility(
          'Não foi possível salvar a preferência de região no servidor.'
        );
      }
    }
  };

  return (
    <AccessibleModal
      visible={visible}
      transparent
      animationType="fade"
      onClose={onClose}
      initialFocusRef={closeButtonRef}
      returnFocusRef={returnFocusRef}
      accessibilityLabel="Seletor de região"
    >
      <View style={styles.backdrop}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <Ionicons name="location" size={22} color={theme.colors.brandForest} />
              <Text style={styles.title}>Selecionar Região</Text>
            </View>
            <TouchableOpacity
              ref={closeButtonRef}
              style={styles.closeButton}
              onPress={onClose}
              {...makeAccessibleButton('Fechar', 'Fecha o seletor de região')}
            >
              <Ionicons name="close" size={24} color={theme.colors.onSurface} />
            </TouchableOpacity>
          </View>

          {regionsQuery.isPending ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.brandForest} />
              <Text style={styles.loadingText}>Carregando regiões...</Text>
            </View>
          ) : regionsQuery.isError ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>Erro ao carregar lista de regiões.</Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={() => void regionsQuery.refetch()}
                {...makeAccessibleButton('Tentar novamente')}
              >
                <Text style={styles.retryText}>Tentar novamente</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView contentContainerStyle={styles.listContent}>
              {/* Opção Canônica: Todas as Regiões */}
              <TouchableOpacity
                key="all-regions"
                style={[styles.regionOption, isAllSelected && styles.regionOptionSelected]}
                onPress={() => void handleSelectRegion(null)}
                accessibilityRole="button"
                accessibilityState={{ selected: isAllSelected }}
                accessibilityLabel={`Todas as regiões. Visão consolidada de todas as rotas. ${isAllSelected ? 'Selecionada' : 'Toque para selecionar'}`}
              >
                <View style={styles.regionLeftRow}>
                  <Ionicons
                    name="globe-outline"
                    size={22}
                    color={isAllSelected ? theme.colors.brandForest : theme.colors.brandSage}
                    style={styles.optionIcon}
                  />
                  <View style={styles.regionInfo}>
                    <Text style={[styles.regionName, isAllSelected && styles.regionNameSelected]}>
                      Todas as regiões
                    </Text>
                    <Text style={styles.regionState}>Todas as rotas disponíveis</Text>
                  </View>
                </View>
                {isAllSelected && (
                  <Ionicons name="checkmark-circle" size={22} color={theme.colors.brandForest} />
                )}
              </TouchableOpacity>

              {/* Regiões Específicas */}
              {regionsQuery.data?.map((region: Region) => {
                const isSelected = !isAllSelected && region.id === state.activeRegionId;
                return (
                  <TouchableOpacity
                    key={region.id}
                    style={[styles.regionOption, isSelected && styles.regionOptionSelected]}
                    onPress={() => void handleSelectRegion(region)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                    accessibilityLabel={`${region.name}, ${region.state_code}. ${isSelected ? 'Selecionada' : 'Toque para selecionar'}`}
                  >
                    <View style={styles.regionLeftRow}>
                      <Ionicons
                        name="location-outline"
                        size={22}
                        color={isSelected ? theme.colors.brandForest : theme.colors.brandSage}
                        style={styles.optionIcon}
                      />
                      <View style={styles.regionInfo}>
                        <Text style={[styles.regionName, isSelected && styles.regionNameSelected]}>
                          {region.name}
                        </Text>
                        <Text style={styles.regionState}>{region.state_code}</Text>
                      </View>
                    </View>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={22} color={theme.colors.brandForest} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </View>
      </View>
    </AccessibleModal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.marginMobile,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    backgroundColor: theme.colors.surfaceWhite,
    borderRadius: theme.radii.xl,
    padding: theme.spacing.marginMobile,
    ...theme.shadows.card,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.stackMd,
    paddingBottom: theme.spacing.stackSm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surfaceContainer,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    ...theme.typography.headlineMd,
    color: theme.colors.brandDeep,
  },
  closeButton: {
    padding: 4,
    borderRadius: theme.radii.full,
  },
  loadingContainer: {
    padding: 32,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    ...theme.typography.bodyMd,
    color: theme.colors.onSurfaceVariant,
  },
  errorContainer: {
    padding: 24,
    alignItems: 'center',
    gap: 12,
  },
  errorText: {
    ...theme.typography.bodyMd,
    color: theme.colors.error,
  },
  retryButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: theme.colors.brandForest,
    borderRadius: theme.radii.full,
  },
  retryText: {
    ...theme.typography.labelMd,
    color: theme.colors.onPrimary,
    fontWeight: '600',
  },
  listContent: {
    gap: 8,
  },
  regionOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: theme.radii.lg,
    backgroundColor: theme.colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  regionOptionSelected: {
    backgroundColor: theme.colors.secondaryContainer,
    borderColor: theme.colors.brandForest,
  },
  regionLeftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  optionIcon: {
    marginRight: 2,
  },
  regionInfo: {
    flex: 1,
  },
  regionName: {
    ...theme.typography.titleMd,
    color: theme.colors.brandDeep,
  },
  regionNameSelected: {
    color: theme.colors.brandForest,
    fontWeight: '700',
  },
  regionState: {
    ...theme.typography.bodySm,
    color: theme.colors.onSurfaceVariant,
  },
});
