import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';
import { makeAccessibleButton } from '../../utils/accessibility';
import { MotionPressable } from './MotionPressable';

interface FilterChipProps {
  label: string;
  isSelected: boolean;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
}

export const FilterChip: React.FC<FilterChipProps> = ({
  label,
  isSelected,
  onPress,
  icon,
}) => {
  return (
    <MotionPressable
      style={[
        styles.chip,
        isSelected ? styles.chipSelected : styles.chipUnselected,
      ]}
      onPress={onPress}
      {...makeAccessibleButton(
        `Filtro ${label}`,
        isSelected ? 'Filtro ativado. Toque para desativar.' : 'Toque para filtrar por esta categoria.'
      )}
      accessibilityState={{ disabled: false, selected: isSelected }}
    >
      {icon && (
        <Ionicons
          name={icon}
          size={16}
          color={isSelected ? theme.colors.onPrimary : theme.colors.brandForest}
          style={styles.icon}
        />
      )}
      <Text
        style={[
          styles.chipText,
          isSelected ? styles.textSelected : styles.textUnselected,
        ]}
      >
        {label}
      </Text>
    </MotionPressable>
  );
};

const styles = StyleSheet.create({
  chip: {
    minHeight: 44,
    paddingHorizontal: 16,
    borderRadius: theme.radii.full,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  chipSelected: {
    backgroundColor: theme.colors.brandForest,
    ...theme.shadows.sm,
  },
  chipUnselected: {
    backgroundColor: theme.colors.surfaceWhite,
    borderWidth: 1,
    borderColor: theme.colors.surfaceContainerHigh,
  },
  icon: {
    marginRight: 6,
  },
  chipText: {
    ...theme.typography.labelMd,
  },
  textSelected: {
    color: theme.colors.onPrimary,
    fontWeight: '700',
  },
  textUnselected: {
    color: theme.colors.onSurfaceVariant,
    fontWeight: '600',
  },
});
