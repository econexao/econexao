import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';
import { useApp } from '../../hooks/useApp';
import { makeAccessibleButton } from '../../utils/accessibility';
import { useRegionsQuery } from '../../hooks/queries';
import { getRegionDisplayName } from '../routes/routeCoverImage';
import { RegionSelectorModal } from './RegionSelectorModal';
import { useResponsiveLayout } from '../../hooks/useResponsiveLayout';

interface AppHeaderProps {
  showBack?: boolean;
  onBackPress?: () => void;
  fallbackHref?: string;
  title?: string;
  overlayOnImage?: boolean;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  showBack = false,
  onBackPress,
  fallbackHref,
  title = 'ECOnexão',
  overlayOnImage = false,
}) => {
  const router = useRouter();
  const { state } = useApp();
  const { isWide } = useResponsiveLayout();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBackHovered, setIsBackHovered] = useState(false);
  const [isBackFocused, setIsBackFocused] = useState(false);
  const [isRegionHovered, setIsRegionHovered] = useState(false);
  const [isRegionFocused, setIsRegionFocused] = useState(false);

  const regionButtonRef = React.useRef<React.ElementRef<typeof TouchableOpacity>>(null);
  const regions = useRegionsQuery();
  const isAllRegions = !state.activeRegionId || state.activeRegionId === 'all';
  const activeRegion = isAllRegions
    ? null
    : regions.data?.find((region) => region.id === state.activeRegionId);
  const regionLabel = isAllRegions
    ? 'Todas as regiões'
    : (activeRegion ? getRegionDisplayName(activeRegion) : 'Selecionar região');

  const handleBack = () => {
    if (onBackPress) {
      onBackPress();
      return;
    }
    if (router.canGoBack()) {
      router.back();
    } else if (fallbackHref) {
      router.replace(fallbackHref as any);
    } else {
      router.replace('/(tabs)/(routes)');
    }
  };

  return (
    <>
      <View style={[styles.headerContainer, overlayOnImage && styles.headerOnImage]}>
        <View style={[styles.innerContainer, isWide && styles.innerContainerDesktop]}>
          <View style={styles.leftRow}>
            {showBack ? (
              <>
                <TouchableOpacity
                  style={[
                    styles.backButton,
                    isBackHovered &&
                      (overlayOnImage
                        ? styles.backButtonHoveredOnImage
                        : styles.backButtonHovered),
                    isBackFocused &&
                      (overlayOnImage
                        ? styles.backButtonFocusedOnImage
                        : styles.backButtonFocused),
                  ]}
                  onPress={handleBack}
                  onFocus={() => setIsBackFocused(true)}
                  onBlur={() => setIsBackFocused(false)}
                  {...({
                    onMouseEnter: () => setIsBackHovered(true),
                    onMouseLeave: () => setIsBackHovered(false),
                  } as any)}
                  {...makeAccessibleButton('Voltar', 'Retorna à tela anterior')}
                >
                  <Ionicons
                    name="arrow-back"
                    size={24}
                    color={overlayOnImage ? theme.colors.surfaceWhite : theme.colors.brandForest}
                  />
                </TouchableOpacity>
                <Text
                  style={[styles.brandTitle, overlayOnImage && styles.brandTitleOnImage]}
                  numberOfLines={1}
                >
                  {title}
                </Text>
              </>
            ) : (
              <Text
                style={[styles.brandTitle, overlayOnImage && styles.brandTitleOnImage]}
                numberOfLines={1}
              >
                {title}
              </Text>
            )}
          </View>

          <TouchableOpacity
            ref={regionButtonRef}
            style={[
              styles.regionChip,
              isWide && styles.regionChipDesktop,
              overlayOnImage && styles.regionChipOnImage,
              isRegionHovered &&
                (overlayOnImage
                  ? styles.regionChipHoveredOnImage
                  : styles.regionChipHovered),
              isRegionFocused &&
                (overlayOnImage
                  ? styles.regionChipFocusedOnImage
                  : styles.regionChipFocused),
            ]}
            onPress={() => setIsModalOpen(true)}
            onFocus={() => setIsRegionFocused(true)}
            onBlur={() => setIsRegionFocused(false)}
            {...({
              onMouseEnter: () => setIsRegionHovered(true),
              onMouseLeave: () => setIsRegionHovered(false),
            } as any)}
            {...makeAccessibleButton(
              `Região atual: ${regionLabel}`,
              'Toque para abrir o seletor de região'
            )}
          >
            <Ionicons
              name={isAllRegions ? 'globe-outline' : 'location'}
              size={16}
              color={overlayOnImage ? theme.colors.surfaceWhite : theme.colors.brandSage}
            />
            <Text
              style={[styles.regionText, overlayOnImage && styles.regionTextOnImage]}
              numberOfLines={1}
            >
              {regionLabel}
            </Text>
          </TouchableOpacity>
        </View>
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
    width: '100%',
    backgroundColor: 'rgba(249, 250, 247, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surfaceContainer,
    justifyContent: 'center',
    zIndex: 50,
  },
  headerOnImage: {
    backgroundColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  innerContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.marginMobile,
    width: '100%',
  },
  innerContainerDesktop: {
    maxWidth: 1200,
    alignSelf: 'center',
    paddingHorizontal: 24,
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
    borderWidth: 2,
    borderColor: 'transparent',
    ...(Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : {}),
  },
  backButtonHovered: {
    backgroundColor: 'rgba(51, 96, 30, 0.08)',
  },
  backButtonHoveredOnImage: {
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
  },
  backButtonFocused: {
    borderColor: theme.colors.brandForest,
    backgroundColor: 'rgba(51, 96, 30, 0.08)',
    ...(Platform.OS === 'web'
      ? ({
          outlineWidth: 2,
          outlineStyle: 'solid',
          outlineColor: theme.colors.brandForest,
          outlineOffset: 2,
        } as any)
      : {}),
  },
  backButtonFocusedOnImage: {
    borderColor: theme.colors.surfaceWhite,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    ...(Platform.OS === 'web'
      ? ({
          outlineWidth: 2,
          outlineStyle: 'solid',
          outlineColor: theme.colors.surfaceWhite,
          outlineOffset: 2,
        } as any)
      : {}),
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
    ...(Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : {}),
  },
  regionChipDesktop: {
    maxWidth: 280,
  },
  regionChipHovered: {
    backgroundColor: 'rgba(51, 96, 30, 0.08)',
    borderColor: 'rgba(117, 155, 113, 0.45)',
  },
  regionChipHoveredOnImage: {
    backgroundColor: 'rgba(18, 43, 28, 0.88)',
    borderColor: 'rgba(255, 255, 255, 0.55)',
  },
  regionChipFocused: {
    borderColor: theme.colors.brandForest,
    borderWidth: 1.5,
    ...(Platform.OS === 'web'
      ? ({
          outlineWidth: 2,
          outlineStyle: 'solid',
          outlineColor: theme.colors.brandForest,
          outlineOffset: 2,
        } as any)
      : {}),
  },
  regionChipFocusedOnImage: {
    borderColor: theme.colors.surfaceWhite,
    borderWidth: 1.5,
    ...(Platform.OS === 'web'
      ? ({
          outlineWidth: 2,
          outlineStyle: 'solid',
          outlineColor: theme.colors.surfaceWhite,
          outlineOffset: 2,
        } as any)
      : {}),
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

