import type { DeliveryAddressDraft, DeliveryAddressErrors } from './types';

const PHONE_PATTERN = /^[+\d][\d\s().-]{7,19}$/;

export function validateDeliveryAddress(address: DeliveryAddressDraft): DeliveryAddressErrors {
  const errors: DeliveryAddressErrors = {};
  if (address.recipientName.trim().length < 2) errors.recipientName = 'Indiquez le nom de la personne qui recevra la commande.';
  if (!PHONE_PATTERN.test(address.phone.trim())) errors.phone = 'Indiquez un numéro de téléphone valide.';
  if (address.addressLine.trim().length < 8) errors.addressLine = 'Décrivez l’adresse avec suffisamment de précision.';
  return errors;
}

export function hasAddressErrors(errors: DeliveryAddressErrors) {
  return Object.keys(errors).length > 0;
}

export function sanitizeDeliveryAddress(address: DeliveryAddressDraft): DeliveryAddressDraft {
  return {
    recipientName: address.recipientName.trim(),
    phone: address.phone.trim(),
    addressLine: address.addressLine.trim(),
    neighborhood: address.neighborhood.trim(),
    landmark: address.landmark.trim(),
    instructions: address.instructions.trim(),
    city: address.city,
  };
}

