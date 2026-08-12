import type { ImageSourcePropType } from 'react-native';
import type { ApiCategory, ApiProduct, Category, Product } from '@/types/menu';

const images: Record<string, ImageSourcePropType> = {
  crepes: require('../../assets/menu/category-crepes.png'),
  'ice-cream': require('../../assets/menu/category-ice-cream.png'),
  smoothies: require('../../assets/menu/category-smoothies.png'),
  breakfast: require('../../assets/menu/moroccan-breakfast.jpg'),
  salads: require('../../assets/menu/category-salads.png'),
  skillet: require('../../assets/menu/category-skillet.png'),
  pizza: require('../../assets/menu/mediterranean-pizza.jpg'),
  sandwiches: require('../../assets/menu/category-sandwiches.png'),
  seafood: require('../../assets/menu/category-seafood.png'),
  tagine: require('../../assets/menu/chicken-tagine.jpg'),
  fruit: require('../../assets/menu/category-smoothies.png'),
  dessert: require('../../assets/menu/orange-creme-brulee.jpg'),
  tea: require('../../assets/menu/mint-tea.jpg'),
  cafe: require('../../assets/menu/mint-tea.jpg'),
};

const iconByImageKey: Record<string, string> = {
  crepes: 'layers-outline', 'ice-cream': 'ice-cream-outline', smoothies: 'nutrition-outline',
  breakfast: 'sunny-outline', salads: 'leaf-outline', skillet: 'flame-outline',
  pizza: 'pizza-outline', sandwiches: 'fast-food-outline', seafood: 'fish-outline',
  tagine: 'restaurant-outline', fruit: 'nutrition-outline', dessert: 'cafe-outline',
};

export const fallbackImage = images.tagine;

function resolveImage(value?: string) {
  if (value?.startsWith('http://') || value?.startsWith('https://') || value?.startsWith('data:image/')) return { uri: value };
  return images[value ?? ''] ?? fallbackImage;
}

export function mapCategory(category: ApiCategory): Category {
  const imageKey = category.imageUrl ?? 'tagine';
  return { id: category.id, name: category.name, icon: iconByImageKey[imageKey] ?? 'restaurant-outline', image: category.imageUrl ? resolveImage(category.imageUrl) : undefined };
}

export function mapProduct(product: ApiProduct): Product {
  return {
    id: product.id,
    categoryId: product.categoryId,
    name: product.name,
    description: product.description,
    price: Number(product.price),
    image: resolveImage(product.imageUrl),
    available: product.isAvailable,
    featured: product.isFeatured,
    options: product.options?.map((option) => ({
      id: option.id,
      name: option.name,
      values: option.values.map((value) => ({ id: value.id, label: value.label, priceDelta: Number(value.priceDelta) })),
    })),
  };
}
