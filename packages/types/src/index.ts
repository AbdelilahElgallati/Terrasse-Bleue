export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'READY'
  | 'COMPLETED'
  | 'CANCELLED';

export type OrderStatusIcon =
  | 'receipt'
  | 'check-circle'
  | 'timer'
  | 'ready'
  | 'completed'
  | 'cancelled';

export type OrderStatusTone =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'completed'
  | 'cancelled';

export type OrderStatusPresentation = {
  customerLabel: string;
  shortLabel: string;
  adminLabel: string;
  explanation: string;
  customerMessage: string;
  icon: OrderStatusIcon;
  tone: OrderStatusTone;
  timelinePosition: number | null;
  terminal: boolean;
};

export const ORDER_STATUS_PRESENTATION: Readonly<Record<OrderStatus, OrderStatusPresentation>> = {
  PENDING: {
    customerLabel: 'Commande reçue',
    shortLabel: 'Reçue',
    adminLabel: 'Nouvelle',
    explanation: 'La commande est enregistrée et attend la confirmation du restaurant.',
    customerMessage: 'Votre commande est bien enregistrée.',
    icon: 'receipt',
    tone: 'pending',
    timelinePosition: 0,
    terminal: false,
  },
  CONFIRMED: {
    customerLabel: 'Commande confirmée',
    shortLabel: 'Confirmée',
    adminLabel: 'Confirmée',
    explanation: 'Le restaurant a accepté la commande.',
    customerMessage: 'La cuisine a accepté votre commande.',
    icon: 'check-circle',
    tone: 'confirmed',
    timelinePosition: 1,
    terminal: false,
  },
  PREPARING: {
    customerLabel: 'En préparation',
    shortLabel: 'En préparation',
    adminLabel: 'En préparation',
    explanation: 'La commande est en cours de préparation.',
    customerMessage: 'Notre équipe prépare votre repas.',
    icon: 'timer',
    tone: 'preparing',
    timelinePosition: 2,
    terminal: false,
  },
  READY: {
    customerLabel: 'Commande prête',
    shortLabel: 'Prête',
    adminLabel: 'Prête',
    explanation: 'La commande est prête à être servie ou retirée.',
    customerMessage: 'Votre commande vous attend.',
    icon: 'ready',
    tone: 'ready',
    timelinePosition: 3,
    terminal: false,
  },
  COMPLETED: {
    customerLabel: 'Commande terminée',
    shortLabel: 'Terminée',
    adminLabel: 'Terminée',
    explanation: 'La commande a été remise au client.',
    customerMessage: 'Merci et bon appétit !',
    icon: 'completed',
    tone: 'completed',
    timelinePosition: 4,
    terminal: true,
  },
  CANCELLED: {
    customerLabel: 'Commande annulée',
    shortLabel: 'Annulée',
    adminLabel: 'Annulée',
    explanation: 'La commande a été annulée.',
    customerMessage: 'Cette commande a été annulée.',
    icon: 'cancelled',
    tone: 'cancelled',
    timelinePosition: null,
    terminal: true,
  },
};

export const ORDER_STATUS_SEQUENCE: readonly OrderStatus[] = [
  'PENDING',
  'CONFIRMED',
  'PREPARING',
  'READY',
  'COMPLETED',
];

export const EXPERIENCE_TERMS = {
  menu: 'La carte',
  category: 'Catégorie',
  product: 'Produit',
  option: 'Option',
  supplement: 'Supplément',
  quantity: 'Quantité',
  cart: 'Panier',
  order: 'Commande',
  dineIn: 'Sur place',
  takeaway: 'À emporter',
  cashPayment: 'Paiement sur place — en espèces',
  trackOrder: 'Suivre ma commande',
} as const;

function numericPrice(value: string | number) {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function formatMAD(value: string | number) {
  const amount = numericPrice(value);
  const hasDecimals = Math.abs(amount - Math.round(amount)) > 0.000_001;
  return `${amount.toLocaleString('fr-FR', {
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: 2,
  })} MAD`;
}

export function formatMADSupplement(value: string | number) {
  return `+${formatMAD(value)}`;
}

export const brandPrimitives = {
  navy: '#123B4A',
  turquoise: '#2C8C8C',
  terracotta: '#D9785B',
  ivory: '#F7F1E5',
  sand: '#E9DDC9',
} as const;

export const designMetrics = {
  spacing: [0, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80] as const,
  radius: { small: 8, medium: 12, large: 16, feature: 24, pill: 999 } as const,
  touchTarget: 44,
  motion: { instant: 100, fast: 160, standard: 240, emphasis: 360 } as const,
} as const;
