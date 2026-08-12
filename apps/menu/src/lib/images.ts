const localImages: Record<string, string> = {
  crepes: '/menu/category-crepes.png', 'ice-cream': '/menu/category-ice-cream.png', smoothies: '/menu/category-smoothies.png',
  breakfast: '/menu/moroccan-breakfast.jpg', salads: '/menu/category-salads.png', skillet: '/menu/category-skillet.png',
  pizza: '/menu/mediterranean-pizza.jpg', sandwiches: '/menu/category-sandwiches.png', seafood: '/menu/category-seafood.png',
  tagine: '/menu/chicken-tagine.jpg', fruit: '/menu/category-smoothies.png', dessert: '/menu/orange-creme-brulee.jpg',
  tea: '/menu/mint-tea.jpg', cafe: '/menu/mint-tea.jpg',
};
export function imageSrc(value?: string) { if (value?.startsWith('http://') || value?.startsWith('https://') || value?.startsWith('data:image/')) return value; return localImages[value || ''] || '/menu-fallback.svg'; }
