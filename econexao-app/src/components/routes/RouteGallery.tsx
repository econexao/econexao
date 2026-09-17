import React, { useRef, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
  const reducedMotion = useReducedMotion();
  const maxX = Math.max(0, contentWidth - containerWidth);
  const canPrev = scrollX > 4;
  const canNext = scrollX < maxX - 4;
  const move = (delta: number) => {
    const target = Math.max(0, Math.min(maxX, scrollX + delta));
    scrollRef.current?.scrollTo({ x: target, animated: !reducedMotion });
  };
  if (!images.length) return null;

  return (
    <View style={styles.section}>
      <View style={styles.headingRow}>
        <Ionicons name="images-outline" size={19} color={theme.colors.brandForest} />
        <Text style={styles.title} accessibilityRole="header">Galeria da Rota</Text>
        <Text style={styles.count}>{images.length} {images.length === 1 ? 'foto' : 'fotos'}</Text>
        {images.length > 1 && (
          <View style={styles.controls}>
            <TouchableOpacity disabled={!canPrev} onPress={() => move(-160)} style={[styles.control, !canPrev && styles.disabled]} {...makeAccessibleButton('Foto anterior da rota', 'Mostra as fotos anteriores', !canPrev)}>
              <Ionicons name="chevron-back" size={18} color={canPrev ? theme.colors.brandDeep : theme.colors.outlineVariant} />
            </TouchableOpacity>
            <TouchableOpacity disabled={!canNext} onPress={() => move(160)} style={[styles.control, !canNext && styles.disabled]} {...makeAccessibleButton('Próxima foto da rota', 'Mostra as próximas fotos', !canNext)}>
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
          <Image
            key={image.key}
            source={image.source}
            style={[styles.image, index === 0 && styles.firstImage, !loaded[image.key] && styles.imageLoading]}
            resizeMode="cover"
            onLoad={() => setLoaded((current) => ({ ...current, [image.key]: true }))}
            accessible
            accessibilityLabel={image.alt}
          />
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  section: { gap: 10 },
  headingRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  title: { ...theme.typography.headlineSm, color: theme.colors.brandDeep, flex: 1 },
  count: { ...theme.typography.labelSm, color: theme.colors.onSurfaceVariant },
  controls: { flexDirection: 'row', gap: 6 },
  control: { width: 36, height: 36, borderRadius: theme.radii.full, borderWidth: 1, borderColor: theme.colors.outlineVariant, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.surfaceWhite },
  disabled: { opacity: 0.4 },
  gallery: { gap: 10, paddingRight: theme.spacing.marginMobile },
  image: {
    width: 128,
    height: 96,
    borderRadius: theme.radii.lg,
    backgroundColor: theme.colors.surfaceContainerLow,
  },
  imageLoading: { opacity: 0.35 },
  firstImage: { width: 152 },
});
