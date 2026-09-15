import React from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { RouteDetail } from '../../api/types';
import { theme } from '../../theme/theme';
import { getRouteGalleryImages } from './routeCoverImage';

export const RouteGallery: React.FC<{ route: RouteDetail }> = ({ route }) => {
  const images = getRouteGalleryImages(route);
  if (!images.length) return null;

  return (
    <View style={styles.section}>
      <View style={styles.headingRow}>
        <Ionicons name="images-outline" size={19} color={theme.colors.brandForest} />
        <Text style={styles.title} accessibilityRole="header">Galeria da Rota</Text>
        <Text style={styles.count}>{images.length} {images.length === 1 ? 'foto' : 'fotos'}</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.gallery}
        accessibilityLabel={`Galeria com ${images.length} fotos da rota`}
      >
        {images.map((image, index) => (
          <Image
            key={image.key}
            source={image.source}
            style={[styles.image, index === 0 && styles.firstImage]}
            resizeMode="cover"
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
  gallery: { gap: 10, paddingRight: theme.spacing.marginMobile },
  image: {
    width: 128,
    height: 96,
    borderRadius: theme.radii.lg,
    backgroundColor: theme.colors.surfaceContainerLow,
  },
  firstImage: { width: 152 },
});
