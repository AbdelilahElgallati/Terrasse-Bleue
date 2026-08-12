import assert from 'node:assert/strict';
import { selectCartCount, selectCartTotal, useCartStore } from '../apps/mobile/src/store/cart-store';
import type { Product } from '../apps/mobile/src/types/menu';

function requiresProductConfiguration(value: Pick<Product, 'options'>) {
  return Boolean(value.options?.length);
}

const product: Product = {
  id: 'product-1', categoryId: 'category-1', name: 'Produit test', description: 'Test',
  price: 20, image: 1, available: true, featured: false,
  options: [{ id: 'option-1', name: 'Supplément', values: [{ id: 'value-1', label: 'Extra', priceDelta: 5 }] }],
};

assert.equal(requiresProductConfiguration(product), true);
assert.equal(requiresProductConfiguration({ options: [] }), false);

useCartStore.getState().clear();
useCartStore.getState().addItem(product, 1, { 'option-1': 'value-1' });
let state = useCartStore.getState();
assert.equal(state.items[0]?.unitPrice, 25);
assert.equal(selectCartCount(state), 1);
assert.equal(selectCartTotal(state), 25);
const id = state.items[0]!.id;
useCartStore.getState().increase(id);
assert.equal(selectCartTotal(useCartStore.getState()), 50);
useCartStore.getState().decrease(id);
assert.equal(selectCartCount(useCartStore.getState()), 1);
useCartStore.getState().addItem(product, 2, { 'option-1': 'value-1' });
assert.equal(selectCartCount(useCartStore.getState()), 3);
useCartStore.getState().remove(id);
assert.equal(useCartStore.getState().items.length, 0);
useCartStore.getState().addItem(product);
useCartStore.getState().clear();
assert.equal(selectCartTotal(useCartStore.getState()), 0);
console.info('Cart behavior check passed.');
