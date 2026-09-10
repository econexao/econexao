import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';
import { useApp } from '../../hooks/useApp';
import { makeAccessibleButton } from '../../utils/accessibility';
import { useRegionsQuery } from '../../hooks/queries';
import { RegionSelectorModal } from './RegionSelectorModal';

interface AppHeaderProps {
  showBack?: boolean;
  onBackPress?: () => void;
  title?: string;
  overlayOnImage?: boolean;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  showBack = false,
  onBackPress,
  title = 'ECOnexão',
  overlayOnImage = false,
}) => {
  const { state } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const regionButtonRef = React.useRef<React.ElementRef<typeof TouchableOpacity>>(null);
  const regions = useRegionsQuery();
  const activeRegion = regions.data?.find((region) => region.id === state.activeRegionId);

  return (
    <>
      <View style={[styles.headerContainer, overlayOnImage && styles.headerOnImage]}>
        <View style={styles.leftRow}>
          {showBack ? (
            <>
              <TouchableOpacity
                style={styles.backButton}
                onPress={onBackPress}
                {...makeAccessibleButton('Voltar', 'Retorna à tela anterior')}
              >
                <Ionicons name="arrow-back" size={24} color={theme.colors.brandForest} />
              </TouchableOpacity>
              <Text
                style={[styles.brandTitle, overlayOnImage && styles.brandTitleOnImage]}
                numberOfLines={1}
              >
                {title}
              </Text>
            </>
          ) : (
            <Text style={[styles.brandTitle, overlayOnImage && styles.brandTitleOnImage]}>
              {title}
            </Text>
          )}
        </View>

        <TouchableOpacity
          ref={regionButtonRef}
          style={[styles.regionChip, overlayOnImage && styles.regionChipOnImage]}
          onPress={() => setIsModalOpen(true)}
          {...makeAccessibleButton(
            `Região atual: ${activeRegion?.name ?? 'não selecionada'}`,
            'Toque para abrir o seletor de região'
          )}
        >
          <Ionicons
            name="location"
            size={16}
            color={overlayOnImage ? theme.colors.surfaceWhite : theme.colors.brandSage}
          />
          <Text
            style={[styles.regionText, overlayOnImage && styles.regionTextOnImage]}
            numberOfLines={1}
          >
            {activeRegion?.name ?? 'Selecionar região'}
          </Text>
        </TouchableOpacity>
      </View>

      <RegionSelectorModal
        visible={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        returnFocusRef={regionButtonRef}
      />
    </>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    height: 64,
    backgroundColor: 'rgba(249, 250, 247, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surfaceContainer,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.marginMobile,
    zIndex: 50,
  },
  headerOnImage: {
    backgroundColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    minWidth: theme.spacing.touchMin,
    minHeight: theme.spacing.touchMin,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radii.full,
    marginRight: theme.spacing.stackSm,
  },
  brandTitle: {
    ...theme.typography.headlineMd,
    color: theme.colors.brandForest,
  },
  brandTitleOnImage: {
    color: theme.colors.surfaceWhite,
  },
  regionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.colors.surfaceContainerLow,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: theme.radii.full,
    borderWidth: 1,
    borderColor: 'rgba(117, 155, 113, 0.2)',
    maxWidth: 180,
  },
  regionText: {
    ...theme.typography.labelSm,
    color: theme.colors.brandDeep,
    fontWeight: '600',
  },
  regionChipOnImage: {
    backgroundColor: 'rgba(18, 43, 28, 0.72)',
    borderColor: 'rgba(255, 255, 255, 0.32)',
  },
  regionTextOnImage: {
    color: theme.colors.surfaceWhite,
  },
});
