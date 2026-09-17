import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, AccessibilityInfo } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';
import { makeAccessibleButton } from '../../utils/accessibility';
import type { RouteOrigin } from '../../api/types';
import type { LocationCoordinates } from '../../hooks/useCurrentLocation';

export const MY_LOCATION_ORIGIN_ID = 'current-location-preview';
export const CHOOSE_ON_MAP_ORIGIN_ID = 'map-selection-preview';

export type SelectorOrigin =
  | RouteOrigin
  | {
      id: string;
      name: string;
      code?: string;
      location_name?: string;
      locationName?: string;
      description?: string;
      actor_count?: number;
      actorCount?: number;
      distance_m?: number;
      duration_s?: number;
    };

export interface OriginSelectorProps {
  origins: SelectorOrigin[];
  selectedOriginId?: string;
  onSelectOrigin: (id: string) => void;
  onSelectCurrentLocation?: (coords: LocationCoordinates) => void;
  onStartSelectOnMap?: () => void;
  isLoadingLocation?: boolean;
  enableDynamicRouting?: boolean;
}

export const getOriginIconAndLabel = (origin: SelectorOrigin): { iconName: keyof typeof Ionicons.glyphMap; shortName: string } => {
  const originCode = ('code' in origin && origin.code ? origin.code : origin.id || '').toLowerCase();
  const originName = (origin.name || '').toLowerCase();

  let iconName: keyof typeof Ionicons.glyphMap = 'location-outline';
  let shortName = origin.name || '';

  if (originCode.includes('rodoviaria') || originName.includes('rodoviária') || originName.includes('rodoviaria')) {
    iconName = 'bus-outline';
    shortName = 'Rodoviária';
  } else if (originCode.includes('aeroporto') || originName.includes('aeroporto')) {
    iconName = 'airplane-outline';
    shortName = 'Aeroporto';
  } else if (originCode.includes('porto') || originName.includes('porto') || originCode.includes('fluvial') || originName.includes('fluvial') || originCode.includes('cais') || originName.includes('cais')) {
    iconName = 'boat-outline';
    shortName = originName.includes('cais') || originCode.includes('terminal_fluvial') ? 'Terminal Fluvial' : 'Porto';
  } else if (originCode.includes('centro') || originName.includes('centro')) {
    iconName = 'business-outline';
    shortName = 'Centro';
  }

  return { iconName, shortName };
};

export const findDefaultOrigin = (origins: SelectorOrigin[]): SelectorOrigin | undefined => {
  if (!origins || origins.length === 0) return undefined;
  const rodoviaria = origins.find((o) => {
    const code = ('code' in o && o.code ? o.code : o.id || '').toLowerCase();
    const name = (o.name || '').toLowerCase();
    return code.includes('rodoviaria') || name.includes('rodoviária') || name.includes('rodoviaria');
  });
  return rodoviaria || origins[0];
};

export const OriginSelector: React.FC<OriginSelectorProps> = ({
  origins,
  selectedOriginId,
  onSelectOrigin,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const triggerButtonRef = useRef<any>(null);

  if (!origins || origins.length === 0) return null;

  const defaultOrigin = findDefaultOrigin(origins) || origins[0];
  const activeOrigin = (selectedOriginId && origins.find((o) => o.id === selectedOriginId)) || defaultOrigin;
  const { iconName: currentIcon, shortName: currentName } = getOriginIconAndLabel(activeOrigin);

  const handleSelect = (id: string, name: string) => {
    setIsOpen(false);
    onSelectOrigin(id);
    AccessibilityInfo.announceForAccessibility(`Origem selecionada: ${name}`);
  };

  return (
    <View style={styles.container}>
      <View style={styles.inlineRow}>
        <View style={styles.labelContainer}>
          <Ionicons name="navigate-outline" size={15} color={theme.colors.brandForest} />
          <Text style={styles.label}>saindo de:</Text>
        </View>

        <TouchableOpacity
          ref={triggerButtonRef}
          style={styles.dropdownTrigger}
          onPress={() => setIsOpen((prev) => !prev)}
          {...makeAccessibleButton(`Saindo de: ${currentName}`, 'Toque para alterar o ponto de partida da rota')}
          accessibilityRole="combobox"
          accessibilityState={{ expanded: isOpen }}
        >
          <Ionicons name={currentIcon} size={15} color={theme.colors.brandForest} />
          <Text style={styles.selectedText} numberOfLines={1}>
            {currentName}
          </Text>
          <Ionicons
            name={isOpen ? 'chevron-up' : 'chevron-down'}
            size={14}
            color={theme.colors.brandForest}
          />
        </TouchableOpacity>
      </View>

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setIsOpen(false)}
          accessibilityLabel="Fechar opções de ponto de partida"
          accessibilityRole="button"
        >
          <View
            style={styles.dropdownMenu}
            onStartShouldSetResponder={() => true}
            accessibilityRole="menu"
            accessibilityLabel="Opções de ponto de partida"
          >
            <View style={styles.menuHeader}>
              <Text style={styles.menuTitle}>Selecione o ponto de partida</Text>
            </View>

            {origins.map((origin) => {
              const isSelected = origin.id === activeOrigin.id;
              const { iconName, shortName } = getOriginIconAndLabel(origin);

              return (
                <TouchableOpacity
                  key={origin.id}
                  style={[
                    styles.menuItem,
                    isSelected && styles.menuItemSelected,
                  ]}
                  onPress={() => handleSelect(origin.id, shortName)}
                  accessibilityRole="menuitem"
                  accessibilityLabel={`Selecionar ${shortName}`}
                  accessibilityState={{ selected: isSelected }}
                >
                  <View style={styles.menuItemLeft}>
                    <Ionicons
                      name={iconName}
                      size={18}
                      color={isSelected ? theme.colors.brandForest : theme.colors.brandDeep}
                    />
                    <Text
                      style={[
                        styles.menuItemText,
                        isSelected && styles.menuItemTextSelected,
                      ]}
                    >
                      {shortName}
                    </Text>
                  </View>
                  {isSelected && (
                    <Ionicons name="checkmark" size={16} color={theme.colors.brandForest} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surfaceWhite,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    borderColor: 'rgba(117, 155, 113, 0.2)',
    marginVertical: theme.spacing.stackSm,
    ...theme.shadows.sm,
  },
  inlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  label: {
    ...theme.typography.labelMd,
    color: theme.colors.brandDeep,
    fontWeight: '700',
    fontSize: 14,
  },
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceContainerLow,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: theme.radii.full,
    borderWidth: 1,
    borderColor: 'rgba(117, 155, 113, 0.25)',
    gap: 6,
    maxWidth: '65%',
  },
  selectedText: {
    ...theme.typography.labelSm,
    color: theme.colors.brandForest,
    fontWeight: '700',
    fontSize: 13,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  dropdownMenu: {
    backgroundColor: theme.colors.surfaceWhite,
    borderRadius: theme.radii.xl,
    padding: 16,
    width: '100%',
    maxWidth: 320,
    ...theme.shadows.card,
    borderWidth: 1,
    borderColor: 'rgba(117, 155, 113, 0.2)',
  },
  menuHeader: {
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(117, 155, 113, 0.15)',
  },
  menuTitle: {
    ...theme.typography.labelMd,
    color: theme.colors.brandDeep,
    fontWeight: '700',
    fontSize: 14,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: theme.radii.md,
    marginVertical: 2,
  },
  menuItemSelected: {
    backgroundColor: 'rgba(51, 96, 30, 0.08)',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  menuItemText: {
    ...theme.typography.bodyMd,
    color: theme.colors.brandDeep,
    fontWeight: '500',
    fontSize: 14,
  },
  menuItemTextSelected: {
    color: theme.colors.brandForest,
    fontWeight: '700',
  },
});
