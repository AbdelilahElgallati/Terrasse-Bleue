import { DELIVERY_FEE_MAD, type CheckoutFulfillment } from './types';

export function checkoutDeliveryFee(fulfillment: CheckoutFulfillment) {
  return fulfillment === 'DELIVERY' ? DELIVERY_FEE_MAD : 0;
}

export function checkoutTotal(subtotal: number, fulfillment: CheckoutFulfillment) {
  return subtotal + checkoutDeliveryFee(fulfillment);
}
