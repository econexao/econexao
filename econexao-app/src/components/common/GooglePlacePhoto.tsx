import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { ApiClientError, apiClient } from '../../api/client';
import type { GooglePhotoMetadata } from '../../api/types';
import { theme } from '../../theme/theme';
import { makeAccessibleButton } from '../../utils/accessibility';

import { Ionicons } from '@expo/vector-icons';

type PhotoLoader = (actorId: string) => Promise<{ data: GooglePhotoMetadata }>;

const defaultPhotoLoader: PhotoLoader = (actorId) =>
  apiClient?.getActorGooglePhoto
    ? apiClient.getActorGooglePhoto(actorId)
    : Promise.reject({ status: 404 });

export interface GooglePlacePhotoProps {
  actorId: string;
  alt: string;
  loadPhoto?: PhotoLoader;
  compact?: boolean;
  variant?: 'standard' | 'compact' | 'thumbnail';
  style?: any;
}

/**
 * Google-provided media is requested only when rendered and is never retained as app media.
 * A retry obtains a new opaque grant, which also handles token expiry and removed photos.
 */
export function GooglePlacePhoto({
  actorId,
  alt,
  loadPhoto = defaultPhotoLoader,
  compact = false,
  variant = compact ? 'compact' : 'standard',
  style,
}: GooglePlacePhotoProps) {
  const [photo, setPhoto] = useState<GooglePhotoMetadata | null>(null);
  const [state, setState] = useState<'loading' | 'empty' | 'error' | 'ready'>('loading');
  const [imageLoaded, setImageLoaded] = useState(false);
  const requestIdRef = useRef(0);
  const isThumbnail = variant === 'thumbnail';

  const load = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setState('loading');
    setPhoto(null);
    setImageLoaded(false);
    try {
      const response = await loadPhoto(actorId);
      if (requestId !== requestIdRef.current) return;
      setPhoto(response.data);
      setState('ready');
    } catch (error: any) {
      if (requestId !== requestIdRef.current) return;
      const isServerError = Boolean(
        error &&
        typeof error === 'object' &&
        'status' in error &&
        typeof error.status === 'number' &&
        error.status !== 404
      );
      setState(isServerError ? 'error' : 'empty');
    }
  }, [actorId, loadPhoto]);

  useEffect(() => {
    void load();
    return () => {
      requestIdRef.current += 1;
    };
  }, [load]);

  if (state === 'loading') {
    if (isThumbnail) {
      return (
        <View
          style={[styles.thumbnailState, style]}
          accessibilityRole="progressbar"
          accessibilityLabel="Carregando foto do Google"
        >
          <ActivityIndicator size="small" color={theme.colors.brandForest} />
        </View>
      );
    }
    return (
      <View
        style={[styles.state, compact && styles.compactState, style]}
        accessibilityRole="progressbar"
        accessibilityLabel="Carregando foto do Google"
      >
        <ActivityIndicator size={compact ? 'small' : 'large'} color={theme.colors.brandForest} />
      </View>
    );
  }
  if (state === 'empty') {
    if (isThumbnail) {
      return (
        <View style={[styles.thumbnailFallback, style]} accessibilityRole="text" accessibilityLabel="Foto indisponível">
          <Ionicons name="image-outline" size={24} color={theme.colors.brandForest} />
          <Text style={styles.thumbnailFallbackText}>Sem foto</Text>
        </View>
      );
    }
    return (
      <View style={[styles.state, compact && styles.compactState, style]} accessibilityRole="text">
        <Text style={[styles.message, compact && styles.compactMessage]}>Foto indisponível.</Text>
        <Retry onPress={load} compact={compact} />
      </View>
    );
  }
  if (state === 'error' || !photo) {
    if (isThumbnail) {
      return (
        <Pressable onPress={load} style={[styles.thumbnailFallback, style]} {...makeAccessibleButton('Tentar carregar foto novamente')}>
          <Ionicons name="refresh-outline" size={22} color={theme.colors.brandForest} />
          <Text style={styles.thumbnailFallbackText}>Recarregar</Text>
        </Pressable>
      );
    }
    return (
      <View style={[styles.state, compact && styles.compactState, style]} accessibilityRole="alert">
        <Text style={[styles.message, compact && styles.compactMessage]}>Não foi possível exibir esta foto.</Text>
        <Retry onPress={load} compact={compact} />
      </View>
    );
  }

  if (isThumbnail) {
    return (
      <View style={[styles.thumbnailContainer, style]} accessibilityLabel={`Foto: ${alt}`}>
        <Image
          source={{ uri: photo.proxy_url, cache: 'reload' }}
          accessibilityLabel={alt}
          style={[styles.thumbnailImage, !imageLoaded && styles.imageLoading]}
          resizeMode="cover"
          onLoad={() => setImageLoaded(true)}
          onError={() => { setImageLoaded(true); setState('error'); }}
        />
        <View style={styles.thumbnailGoogleBadgeWrapper}>
          <Text style={styles.thumbnailGoogleBadgeText}>Google</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]} accessibilityLabel={`Foto: ${alt}`}>
      <Image
        source={{ uri: photo.proxy_url, cache: 'reload' }}
        accessibilityLabel={alt}
        style={[styles.image, compact && styles.compactImage, !imageLoaded && styles.imageLoading]}
        onLoad={() => setImageLoaded(true)}
        onError={() => { setImageLoaded(true); setState('error'); }}
      />
      <View style={[styles.attribution, compact && styles.compactAttribution]} accessibilityRole="text" accessibilityLabel="Atribuição da foto">
        <View style={styles.badgeAndCredits}>
          <Text style={styles.googleBadge} accessibilityLabel="Foto fornecida pelo Google">Foto do Google</Text>
          {(photo.author_attributions ?? []).map((author, index) => author.uri ? (
            <Pressable key={`${author.display_name}-${index}`} onPress={() => void Linking.openURL(author.uri!)} {...makeAccessibleButton(`Autor: ${author.display_name}`, 'Abre a página pública do autor no Google Maps')}>
              <Text style={styles.link}>Foto: {author.display_name}</Text>
            </Pressable>
          ) : <Text key={`${author.display_name}-${index}`} style={styles.credit}>Foto: {author.display_name}</Text>)}
        </View>
        <Pressable onPress={() => void Linking.openURL(photo.google_maps_uri)} {...makeAccessibleButton('Ver no Google Maps', 'Abre este local no Google Maps')}>
          <Text style={styles.link}>Ver no Google Maps</Text>
        </Pressable>
      </View>
    </View>
  );
}

function Retry({ onPress, compact }: { onPress: () => void; compact?: boolean }) {
  return (
    <Pressable onPress={onPress} {...makeAccessibleButton('Tentar novamente', 'Solicita uma nova foto temporária')}>
      <Text style={[styles.link, compact && styles.compactLink]}>Tentar novamente</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  thumbnailContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  thumbnailState: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surfaceContainerLow,
    borderRadius: 12,
  },
  thumbnailFallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(117, 155, 113, 0.12)',
    borderRadius: 12,
    gap: 2,
    padding: 4,
  },
  thumbnailFallbackText: {
    ...theme.typography.labelSm,
    fontSize: 9,
    color: theme.colors.brandForest,
    fontWeight: '600',
  },
  thumbnailGoogleBadgeWrapper: {
    position: 'absolute',
    bottom: 3,
    left: 3,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
  thumbnailGoogleBadgeText: {
    ...theme.typography.labelSm,
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '700',
  },
  image: { width: '100%', aspectRatio: 4 / 3, borderRadius: theme.radii.md },
  imageLoading: { opacity: 0.35 },
  compactImage: { width: '100%', aspectRatio: 16 / 9, maxHeight: 150, borderRadius: theme.radii.sm },
  state: { minHeight: 120, alignItems: 'center', justifyContent: 'center', gap: 8, padding: 8 },
  compactState: { minHeight: 70, gap: 4, padding: 4 },
  message: { ...theme.typography.bodyMd, color: theme.colors.onSurfaceVariant },
  compactMessage: { ...theme.typography.bodySm, fontSize: 11 },
  attribution: { marginTop: 8, gap: 4 },
  compactAttribution: { marginTop: 4, gap: 2 },
  badgeAndCredits: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 },
  googleBadge: { ...theme.typography.labelSm, alignSelf: 'flex-start', color: theme.colors.onSurfaceVariant, backgroundColor: theme.colors.surfaceContainer, paddingHorizontal: 6, paddingVertical: 2, borderRadius: theme.radii.sm, fontSize: 10 },
  credit: { ...theme.typography.labelSm, color: theme.colors.onSurfaceVariant, fontSize: 11 },
  link: { ...theme.typography.labelSm, color: theme.colors.brandForest, textDecorationLine: 'underline', fontSize: 11 },
  compactLink: { fontSize: 10 },
});
