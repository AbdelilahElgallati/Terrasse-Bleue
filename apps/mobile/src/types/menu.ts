import type { ImageSourcePropType } from 'react-native';
import type { OrderStatus } from '@terrasse-bleue/types';
export type ApiCategory = { id: string; name: string; description?: string; imageUrl?: string; isActive: boolean; sortOrder: number };
export type ApiProduct = { id: string; categoryId: string; name: string; description: string; price: string | number; imageUrl?: string; isAvailable: boolean; isFeatured: boolean; options?: { id: string; name: string; values: { id: string; label: string; priceDelta: string | number }[] }[] };
export type Category = { id: string; name: string; icon: string; image?: ImageSourcePropType };
export type ProductOption = { id: string; name: string; values: { id: string; label: string; priceDelta: number }[] };
export type Product = { id: string; categoryId: string; name: string; description: string; price: number; image: ImageSourcePropType; available: boolean; featured?: boolean; options?: ProductOption[] };
export type { OrderStatus } from '@terrasse-bleue/types';
export type ApiOrderType = 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY';
export type OrderType = ApiOrderType | 'DELIVERY';
export type PaymentMethod = 'CASH' | 'ONLINE';
export type OrderItemSnapshot = { productId: string; name: string; quantity: number; unitPrice: number };
export type DeliveryAddressSnapshot = { recipientName: string; phone: string; addressLine: string; neighborhood: string; landmark: string; instructions: string; city: 'Essaouira' };
export type DemoOrder = { id: string; number: string; date: string; status: OrderStatus; subtotal: number; deliveryFee: number; total: number; items: OrderItemSnapshot[]; orderType: OrderType; paymentMethod: PaymentMethod; notes?: string; deliveryAddress?: DeliveryAddressSnapshot };
export type ApiOrder = { id: string; orderNumber: string; createdAt: string; status: OrderStatus; subtotal: string | number; deliveryFee: string | number; deliveryAddress?: DeliveryAddressSnapshot; total: string | number; orderType: ApiOrderType; notes?: string; items: { id: string; productId?: string; productNameSnapshot: string; unitPrice: string | number; quantity: number; subtotal: string | number }[]; payment?: { method: PaymentMethod; status: string } };
export function mapOrder(order: ApiOrder): DemoOrder { return { id: order.id, number: order.orderNumber, date: new Date(order.createdAt).toLocaleString('fr-MA'), status: order.status, subtotal: Number(order.subtotal), deliveryFee: Number(order.deliveryFee), deliveryAddress: order.deliveryAddress, total: Number(order.total), orderType: order.orderType, paymentMethod: order.payment?.method ?? 'CASH', notes: order.notes, items: order.items.map((item) => ({ productId: item.productId ?? item.id, name: item.productNameSnapshot, quantity: item.quantity, unitPrice: Number(item.unitPrice) })) }; }
