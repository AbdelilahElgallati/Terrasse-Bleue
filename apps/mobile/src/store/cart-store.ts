import { create } from 'zustand';
import type { Product } from '../types/menu';

export type CartItem = {
  id: string;
  product: Product;
  quantity: number;
  selectedOptions: Record<string, string>;
  unitPrice: number;
};

type CartState = {
  items: CartItem[];
  addItem: (product: Product, quantity?: number, selectedOptions?: Record<string, string>) => void;
  increase: (itemId: string) => void;
  decrease: (itemId: string) => void;
  remove: (itemId: string) => void;
  clear: () => void;
};

function optionPrice(product: Product, selectedOptions: Record<string, string>) {
  return (product.options ?? []).reduce((total, option) => {
    const selected = option.values.find((value) => value.id === selectedOptions[option.id]);
    return total + (selected?.priceDelta ?? 0);
  }, product.price);
}

function itemKey(productId: string, options: Record<string, string>) {
  return `${productId}:${Object.entries(options).sort().map(([key, value]) => `${key}-${value}`).join('|')}`;
}

export const useCartStore = create<CartState>((set) => ({
  items: [],
  addItem: (product, quantity = 1, selectedOptions = {}) => set((state) => {
    const id = itemKey(product.id, selectedOptions);
    const existing = state.items.find((item) => item.id === id);
    if (existing) {
      return { items: state.items.map((item) => item.id === id ? { ...item, quantity: item.quantity + quantity } : item) };
    }
    return { items: [...state.items, { id, product, quantity, selectedOptions, unitPrice: optionPrice(product, selectedOptions) }] };
  }),
  increase: (itemId) => set((state) => ({
    items: state.items.map((item) => item.id === itemId ? { ...item, quantity: item.quantity + 1 } : item),
  })),
  decrease: (itemId) => set((state) => ({
    items: state.items.flatMap((item) => item.id !== itemId ? [item] : item.quantity > 1 ? [{ ...item, quantity: item.quantity - 1 }] : []),
  })),
  remove: (itemId) => set((state) => ({ items: state.items.filter((item) => item.id !== itemId) })),
  clear: () => set({ items: [] }),
}));

export const selectCartCount = (state: CartState) => state.items.reduce((sum, item) => sum + item.quantity, 0);
export const selectCartTotal = (state: CartState) => state.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
