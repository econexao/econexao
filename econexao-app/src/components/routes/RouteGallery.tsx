import React, { useRef, useState } from 'react';
import {
  Image,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import type { RouteDetail } from '../../api/types';
import { theme } from '../../theme/theme';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { makeAccessibleButton } from '../../utils/accessibility';
import { getRouteGalleryImages } from './routeCoverImage';

export const RouteGallery: React.FC<{ route: RouteDetail }> = ({ route }) => {
  const images = getRouteGalleryImages(route);
  const scrollRef = useRef<ScrollView>(null);
  const [scrollX, setScrollX] = useState(0);
  const [contentWidth, setContentWidth] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);
  const [loaded, setLoaded] = useState<Record<string, boolean>>({});
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const reducedMotion = useReducedMotion();

  const maxX = Math.max(0, contentWidth - containerWidth);
  const canPrev = scrollX > 4;
  const canNext = scrollX < maxX - 4;

  const move = (delta: number) => {
    const target = Math.max(0, Math.min(maxX, scrollX + delta));
    scrollRef.current?.scrollTo({ x: target, animated: !reducedMotion });
  };

  if (!images.length) return null;

  const activeImage = selectedImageIndex !== null ? images[selectedImageIndex] : null;
  const hasMultiple = images.length > 1;

  const handleNextImage = () => {
    if (selectedImageIndex !== null && selectedImageIndex < images.length - 1) {
      setSelectedImageIndex(selectedImageIndex + 1);
    }
  };

  const handlePrevImage = () => {
    if (selectedImageIndex !== null && selectedImageIndex > 0) {
      setSelectedImageIndex(selectedImageIndex - 1);
    }
  };

  return (
    <View style={styles.section}>
      <View style={styles.headingRow}>
        <Ionicons name="images-outline" size={19} color={theme.colors.brandForest} />
        <Text style={styles.title} accessibilityRole="header">Galeria da Rota</Text>
        <Text style={styles.count}>{images.length} {images.length === 1 ? 'foto' : 'fotos'}</Text>
        {hasMultiple && (
          <View style={styles.controls}>
            <TouchableOpacity
              disabled={!canPrev}
              onPress={() => move(-160)}
              style={[styles.control, !canPrev && styles.disabled]}
              {...makeAccessibleButton('Foto anterior da rota', 'Mostra as fotos anteriores', !canPrev)}
            >
              <Ionicons name="chevron-back" size={18} color={canPrev ? theme.colors.brandDeep : theme.colors.outlineVariant} />
            </TouchableOpacity>
            <TouchableOpacity
              disabled={!canNext}
              onPress={() => move(160)}
              style={[styles.control, !canNext && styles.disabled]}
              {...makeAccessibleButton('Próxima foto da rota', 'Mostra as próximas fotos', !canNext)}
            >
              <Ionicons name="chevron-forward" size={18} color={canNext ? theme.colors.brandDeep : theme.colors.outlineVariant} />
            </TouchableOpacity>
          </View>
        )}
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.gallery}
        onScroll={(event) => setScrollX(event.nativeEvent.contentOffset.x)}
        onLayout={(event) => setContainerWidth(event.nativeEvent.layout.width)}
        onContentSizeChange={(width) => setContentWidth(width)}
        scrollEventThrottle={16}
        accessibilityLabel={`Galeria com ${images.length} fotos da rota`}
      >
        {images.map((image, index) => (
          <TouchableOpacity
            key={image.key}
            activeOpacity={0.85}
            onPress={() => setSelectedImageIndex(index)}
            {...makeAccessibleButton(
              `Ampliar foto ${index + 1} de ${images.length}: ${image.alt}`,
              'Abre a foto em tela cheia com alta resolução'
            )}
          >
            <Image
              source={image.source}
              style={[styles.image, index === 0 && styles.firstImage, !loaded[image.key] && styles.imageLoading]}
              resizeMode="cover"
              onLoad={() => setLoaded((current) => ({ ...current, [image.key]: true }))}
              accessible={false}
            />
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Fullscreen Photo Modal */}
      <Modal
        visible={selectedImageIndex !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedImageIndex(null)}
      >
        <SafeAreaView style={styles.fullscreenModalContainer}>
          <StatusBar barStyle="light-content" backgroundColor="#000000" />
          
          {/* Top Bar */}
          <View style={styles.modalHeader}>
            <View style={styles.modalHeaderInfo}>
              {hasMultiple && selectedImageIndex !== null && (
                <Text style={styles.modalCounter}>
                  {selectedImageIndex + 1} / {images.length}
                </Text>
              )}
            </View>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setSelectedImageIndex(null)}
              {...makeAccessibleButton('Fechar foto em tela cheia', 'Volta para os detalhes da rota')}
            >
              <Ionicons name="close" size={26} color="#ffffff" />
            </TouchableOpacity>
          </View>

          {/* Main Fullscreen Image Area */}
          <View style={styles.modalImageContainer}>
            {activeImage && (
              <Image
                source={activeImage.source}
                style={styles.fullscreenImage}
                resizeMode="contain"
                accessible
                accessibilityLabel={activeImage.alt}
              />
            )}

            {/* Navigation Arrows for multi-photo gallery */}
            {hasMultiple && selectedImageIndex !== null && (
              <>
                {selectedImageIndex > 0 && (
                  <TouchableOpacity
                    style={[styles.modalNavButton, styles.modalNavButtonLeft]}
                    onPress={handlePrevImage}
                    {...makeAccessibleButton('Foto anterior', 'Navega para a foto anterior')}
                  >
                    <Ionicons name="chevron-back" size={28} color="#ffffff" />
                  </TouchableOpacity>
                )}
                {selectedImageIndex < images.length - 1 && (
                  <TouchableOpacity
                    style={[styles.modalNavButton, styles.modalNavButtonRight]}
                    onPress={handleNextImage}
                    {...makeAccessibleButton('Próxima foto', 'Navega para a próxima foto')}
                  >
                    <Ionicons name="chevron-forward" size={28} color="#ffffff" />
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>

          {/* Bottom Caption Bar */}
          {activeImage && (
            <View style={styles.modalFooter}>
              <Text style={styles.modalCaption}>{activeImage.alt}</Text>
            </View>
          )}
        </SafeAreaView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  section: { gap: 12 },
  headingRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  title: { ...theme.typography.headlineSm, color: theme.colors.brandDeep, flex: 1 },
  count: { ...theme.typography.labelSm, color: theme.colors.onSurfaceVariant },
  controls: { flexDirection: 'row', gap: 6 },
  control: {
    width: 36,
    height: 36,
    borderRadius: theme.radii.full,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surfaceWhite,
  },
  disabled: { opacity: 0.4 },
  gallery: { gap: 12, paddingRight: theme.spacing.marginMobile },
  image: {
    width: 128,
    height: 96,
    borderRadius: theme.radii.lg,
    backgroundColor: theme.colors.surfaceContainerLow,
  },
  imageLoading: { opacity: 0.35 },
  firstImage: { width: 152 },
  fullscreenModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'space-between',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    zIndex: 10,
  },
  modalHeaderInfo: {
    flex: 1,
  },
  modalCounter: {
    ...theme.typography.labelMd,
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: '600',
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalImageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  fullscreenImage: {
    width: '100%',
    height: '100%',
  },
  modalNavButton: {
    position: 'absolute',
    top: '50%',
    marginTop: -24,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  modalNavButtonLeft: {
    left: 16,
  },
  modalNavButtonRight: {
    right: 16,
  },
  modalFooter: {
    paddingHorizontal: 24,
    paddingVertical: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  modalCaption: {
    ...theme.typography.bodyMd,
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: 20,
  },
});

