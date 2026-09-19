import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import type { ActorCategory, MapLegendItem } from '../../api/types';
import { FilterChip } from '../common/FilterChip';
import { Ionicons } from '@expo/vector-icons';

interface CategoryFiltersProps {
  categories: Array<ActorCategory | MapLegendItem>;
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

export const getCategoryIonicons = (
  iconName?: string | null
): keyof typeof Ionicons.glyphMap | null => {
  switch (iconName) {
    case 'utensils':
    case 'restaurant':
      return 'restaurant-outline';
    case 'compass':
      return 'compass-outline';
    case 'bed':
      return 'bed-outline';
    case 'beer':
      return 'beer-outline';
    case 'coffee':
      return 'cafe-outline';
    case 'shopping-cart':
    case 'cart':
      return 'cart-outline';
    case 'store':
    case 'storefront':
      return 'storefront-outline';
    case 'trees':
      return 'leaf-outline';
    case 'sun':
      return 'sunny-outline';
    case 'waves':
      return 'water-outline';
    case 'mountain':
    case 'trail-sign':
      return 'trail-sign-outline';
    case 'landmark':
      return 'business-outline';
    case 'church':
      return 'home-outline';
    case 'umbrella':
      return 'umbrella-outline';
    case 'home':
      return 'home-outline';
    case 'palette':
      return 'color-palette-outline';
    case 'bus':
      return 'bus-outline';
    case 'plane':
      return 'airplane-outline';
    case 'anchor':
    case 'ship':
    case 'boat':
      return 'boat-outline';
    case 'music':
    case 'musical-notes':
      return 'musical-notes-outline';
    case 'bicycle':
    case 'bike':
      return 'bicycle-outline';
    case 'fuel':
      return 'car-outline';
    case 'car':
      return 'car-outline';
    case 'briefcase':
      return 'briefcase-outline';
    case 'heart-pulse':
    case 'cross':
    case 'medkit':
      return 'heart-outline';
    case 'pill':
      return 'medical-outline';
    case 'shield':
    case 'shield-check':
      return 'shield-checkmark-outline';
    case 'scale':
      return 'scale-outline';
    case 'help-circle':
      return 'help-circle-outline';
    default:
      return null;
  }
};

export const CategoryFilters: React.FC<CategoryFiltersProps> = ({
  selectedCategory,
  onSelectCategory,
  categories,
}) => {
  const categoryList = Array.isArray(categories) ? categories : [];
  return (
    <ScrollView
      style={styles.scroller}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      <FilterChip
        label="Tudo"
        isSelected={!selectedCategory}
        onPress={() => onSelectCategory('')}
        icon="apps-outline"
      />
      {categoryList.map((cat) => {
        const slug = 'category_slug' in cat ? cat.category_slug : cat.slug;
        const label = 'count' in cat ? `${cat.label} (${cat.count})` : cat.label;
        return (
          <FilterChip
            key={slug}
            label={label}
            isSelected={selectedCategory === slug}
            onPress={() => onSelectCategory(slug)}
            icon={getCategoryIonicons(cat.icon) ?? undefined}
          />
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scroller: {
    width: '100%',
    maxWidth: '100%',
  },
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: 'center',
  },
});
