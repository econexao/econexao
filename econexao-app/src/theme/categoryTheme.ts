import type { Ionicons } from '@expo/vector-icons';
import { getCategoryIonicons } from '../components/catalog/CategoryFilters';

export interface CategoryVisualMeta {
  slug: string;
  label: string;
  color: string;
  badgeTextColor: string;
  icon: keyof typeof Ionicons.glyphMap;
  order: number;
}

/**
 * ADR 0010 / ADR 0015 canonical categories and color definitions.
 */
export const CANONICAL_CATEGORIES: Record<string, CategoryVisualMeta> = {
  alimentacao: {
    slug: 'alimentacao',
    label: 'Alimentação',
    color: '#D97706',
    badgeTextColor: '#B45309',
    icon: 'restaurant-outline',
    order: 1,
  },
  atrativos: {
    slug: 'atrativos',
    label: 'Atrativos',
    color: '#059669',
    badgeTextColor: '#059669',
    icon: 'compass-outline',
    order: 2,
  },
  hospedagem: {
    slug: 'hospedagem',
    label: 'Hospedagem',
    color: '#2563EB',
    badgeTextColor: '#2563EB',
    icon: 'bed-outline',
    order: 3,
  },
  artesanato: {
    slug: 'artesanato',
    label: 'Artesanato',
    color: '#7C3AED',
    badgeTextColor: '#7C3AED',
    icon: 'color-palette-outline',
    order: 4,
  },
  comercio: {
    slug: 'comercio',
    label: 'Comércio Local & Lojas',
    color: '#EA580C',
    badgeTextColor: '#EA580C',
    icon: 'storefront-outline',
    order: 5,
  },
  experiencias: {
    slug: 'experiencias',
    label: 'Experiências & Passeios',
    color: '#0D9488',
    badgeTextColor: '#0D9488',
    icon: 'boat-outline',
    order: 6,
  },
  vida_noturna: {
    slug: 'vida_noturna',
    label: 'Vida Noturna & Eventos',
    color: '#9333EA',
    badgeTextColor: '#9333EA',
    icon: 'musical-notes-outline',
    order: 7,
  },
  servicos_turisticos: {
    slug: 'servicos_turisticos',
    label: 'Serviços Turísticos & Guias',
    color: '#4F46E5',
    badgeTextColor: '#4F46E5',
    icon: 'briefcase-outline',
    order: 8,
  },
  transporte: {
    slug: 'transporte',
    label: 'Transporte',
    color: '#0891B2',
    badgeTextColor: '#0891B2',
    icon: 'bus-outline',
    order: 9,
  },
  saude: {
    slug: 'saude',
    label: 'Saúde',
    color: '#DC2626',
    badgeTextColor: '#DC2626',
    icon: 'heart-outline',
    order: 10,
  },
  seguranca: {
    slug: 'seguranca',
    label: 'Segurança',
    color: '#1E3A8A',
    badgeTextColor: '#1E3A8A',
    icon: 'shield-checkmark-outline',
    order: 11,
  },
  outros: {
    slug: 'outros',
    label: 'Outros',
    color: '#6B7280',
    badgeTextColor: '#4B5563',
    icon: 'help-circle-outline',
    order: 99,
  },
};

export const getCategoryVisualMeta = (slug?: string | null, label?: string | null): CategoryVisualMeta => {
  const normalizedSlug = (slug || '').toLowerCase().trim();
  if (normalizedSlug in CANONICAL_CATEGORIES) {
    return CANONICAL_CATEGORIES[normalizedSlug];
  }

  // Fallback if slug is not exact match but matches general category
  return {
    slug: normalizedSlug || 'outros',
    label: label || 'Outros',
    color: '#6B7280',
    badgeTextColor: '#4B5563',
    icon: getCategoryIonicons(normalizedSlug) || 'help-circle-outline',
    order: 100,
  };
};
