export const DELIVERY_FEE_MAD = 25;
export const DELIVERY_CITY = 'Essaouira' as const;

export type CheckoutFulfillment = 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY';
export type CheckoutPayment = 'CASH' | 'ONLINE';

export type DeliveryAddressDraft = {
  recipientName: string;
  phone: string;
  addressLine: string;
  neighborhood: string;
  landmark: string;
  instructions: string;
  city: typeof DELIVERY_CITY;
};

export type DeliveryAddressErrors = Partial<Record<keyof DeliveryAddressDraft, string>>;

export const EMPTY_DELIVERY_ADDRESS: DeliveryAddressDraft = {
  recipientName: '',
  phone: '',
  addressLine: '',
  neighborhood: '',
  landmark: '',
  instructions: '',
  city: DELIVERY_CITY,
};
