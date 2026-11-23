import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../theme/theme';
import { makeAccessibleButton } from '../../utils/accessibility';
import { MotionPressable } from './MotionPressable';

interface FilterChipProps {
  label: string;
  isSelected: boolean;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  color?: string;
}

export const FilterChip: React.FC<FilterChipProps> = ({
  label,
  isSelected,
  onPress,
  icon,
  color,
}) => {
  return (
    <MotionPressable
      style={[
        styles.chip,
        isSelected ? styles.chipSelected : styles.chipUnselected,
        color && (isSelected ? { backgroundColor: color } : { borderColor: `${color}99`, backgroundColor: `${color}1A` }),
      ]}
      onPress={onPress}
      {...makeAccessibleButton(
        `Filtro ${label}`,
        isSelected ? 'Filtro ativado. Toque para desativar.' : 'Toque para filtrar por esta categoria.'
      )}
      accessibilityState={{ disabled: false, selected: isSelected }}
    >
      {color && !isSelected && (
        <LinearGradient colors={[`${color}30`, `${color}12`]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
      )}
      {icon && (
        <Ionicons
          name={icon}
          size={16}
          color={isSelected ? theme.colors.onPrimary : color || theme.colors.brandForest}
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
    overflow: 'hidden',
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
    color: theme.colors.onSurface,
    fontWeight: '600',
  },
});
