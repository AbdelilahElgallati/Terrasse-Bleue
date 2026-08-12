import type { DemoOrder } from '@/types/menu';

export const demoOrders: DemoOrder[] = [
  {
    id: 'demo-1042', number: 'TB-1042', date: '8 août 2026 · 13:24',
    status: 'COMPLETED', subtotal: 142, deliveryFee: 0, total: 142,
    items: [
      { productId: 'tajine-citron', name: 'Tajine citron confit', quantity: 1, unitPrice: 96 },
      { productId: 'creme-orange', name: 'Crème brûlée à l’oranger', quantity: 1, unitPrice: 46 },
    ],
    orderType: 'DINE_IN', paymentMethod: 'CASH',
  },
  {
    id: 'demo-0978', number: 'TB-0978', date: '2 août 2026 · 10:05',
    status: 'COMPLETED', subtotal: 102, deliveryFee: 0, total: 102,
    items: [
      { productId: 'petit-dej-essaouira', name: 'Matin d’Essaouira', quantity: 1, unitPrice: 78 },
      { productId: 'the-menthe', name: 'Thé à la menthe', quantity: 1, unitPrice: 24 },
    ],
    orderType: 'DINE_IN', paymentMethod: 'CASH',
  },
];
