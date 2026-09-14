import React from 'react';
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';
import { getCategoryVisualMeta } from '../../theme/categoryTheme';
import { makeAccessibleButton } from '../../utils/accessibility';
import { GooglePlacePhoto } from '../common/GooglePlacePhoto';

export interface SelectedPinCardProps {
  actorId: string;
  name: string;
  categorySlug?: string;
  categoryLabel?: string;
  variant?: 'full' | 'simple';
  googleRating?: number | null;
  ratingCount?: number | null;
  statusText?: string;
  photoUrl?: string | null;
  onPressAction?: () => void;
  actionLabel?: string;
}

export const SelectedPinCard: React.FC<SelectedPinCardProps> = ({
  actorId,
  name,
  categorySlug,
  categoryLabel,
  variant = 'full',
  googleRating,
  ratingCount,
  statusText,
  photoUrl,
  onPressAction,
  actionLabel,
}) => {
  const meta = getCategoryVisualMeta(categorySlug, categoryLabel);
  const isSimple = variant === 'simple';
  const effectiveActionLabel = actionLabel || (isSimple ? 'Ver no mapa' : 'Ver detalhes');

  return (
    <View style={styles.wrapper}>
      <View
        style={[styles.card, isSimple ? styles.cardSimple : styles.cardFull]}
        accessibilityRole="summary"
        accessibilityLabel={`Ponto selecionado: ${name}. Categoria: ${meta.label}.${
          googleRating ? ` Avaliação: ${googleRating.toFixed(1)} estrelas no Google.` : ''
        }`}
      >
        {/* Lado Esquerdo: Foto no modo full */}
        {!isSimple && (
          <View style={styles.thumbnailContainer}>
            {photoUrl ? (
              <Image
                source={{ uri: photoUrl }}
                style={styles.thumbnail}
                resizeMode="cover"
                accessible
                accessibilityLabel={`Foto de ${name}`}
              />
            ) : actorId ? (
              <View style={styles.thumbnailWrapper}>
                <GooglePlacePhoto
                  actorId={actorId}
                  alt={`Foto de ${name}`}
                  compact
                  style={styles.googlePhoto}
                />
              </View>
            ) : (
              <View style={[styles.thumbnailPlaceholder, { backgroundColor: meta.color + '20' }]}>
                <Ionicons name={meta.icon} size={28} color={meta.color} />
              </View>
            )}
          </View>
        )}

        {/* Lado Direito / Conteúdo Central */}
        <View style={styles.contentContainer}>
          {/* Badge de categoria com chip compacto */}
          <View style={styles.badgeRow}>
            <View style={[styles.categoryBadge, { backgroundColor: meta.color + '18' }]}>
              <View style={[styles.categoryDot, { backgroundColor: meta.color }]} />
              <Text style={[styles.categoryBadgeText, { color: meta.badgeTextColor }]}>
                {meta.label}
              </Text>
            </View>
          </View>

          {/* Nome do Local */}
          <Text style={styles.title} numberOfLines={isSimple ? 2 : 1}>
            {name}
          </Text>

          {/* Avaliação Google e status no modo full */}
          {!isSimple && (
            <View style={styles.metaRow}>
              {typeof googleRating === 'number' && Number.isFinite(googleRating) ? (
                <View style={styles.ratingContainer}>
                  <Ionicons name="star" size={13} color="#F59E0B" />
                  <Text style={styles.ratingText}>
                    {googleRating.toFixed(1)}
                    {ratingCount ? ` (${ratingCount})` : ''}
                  </Text>
                </View>
              ) : null}
              {statusText ? (
                <Text style={styles.statusText} numberOfLines={1}>
                  {statusText}
                </Text>
              ) : null}
            </View>
          )}

          {/* Botão de Ação Rápida */}
          <TouchableOpacity
            style={[styles.actionButton, isSimple && styles.actionButtonSimple]}
            onPress={onPressAction}
            {...makeAccessibleButton(
              `${effectiveActionLabel} para ${name}`,
              isSimple ? 'Expande o mapa para ver detalhes deste local' : 'Abre a ficha completa do local'
            )}
          >
            <Text style={styles.actionButtonText}>{effectiveActionLabel}</Text>
            <Ionicons
              name={isSimple ? 'expand-outline' : 'chevron-forward'}
              size={13}
              color={theme.colors.brandForest}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Seta / Caret inferior apontando para a coordenada geográfica exata */}
      <View style={styles.caret} />
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    width: 260,
  },
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 8,
  },
  cardFull: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 88,
  },
  cardSimple: {
    flexDirection: 'column',
    gap: 6,
    width: 220,
    padding: 12,
  },
  thumbnailContainer: {
    width: 72,
    height: 72,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: theme.colors.surfaceContainerLow,
    flexShrink: 0,
  },
  thumbnail: {
    width: 72,
    height: 72,
    borderRadius: 8,
  },
  thumbnailWrapper: {
    width: 72,
    height: 72,
    overflow: 'hidden',
  },
  googlePhoto: {
    width: 72,
    height: 72,
  },
  thumbnailPlaceholder: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    gap: 3,
    minWidth: 0,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 4,
  },
  categoryDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.brandDeep,
    lineHeight: 16,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.brandDeep,
  },
  statusText: {
    fontSize: 11,
    color: theme.colors.brandForest,
    fontWeight: '500',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingVertical: 4,
    minHeight: 32,
    alignSelf: 'flex-start',
  },
  actionButtonSimple: {
    marginTop: 2,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.surfaceContainerLow,
    alignSelf: 'stretch',
    justifyContent: 'center',
  },
  actionButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.brandForest,
  },
  caret: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#FFFFFF',
    alignSelf: 'center',
    marginTop: -1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
  },
});
