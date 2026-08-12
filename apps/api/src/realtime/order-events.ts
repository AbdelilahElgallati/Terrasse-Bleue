import type { OrderStatus } from '../../../../prisma/generated/client/enums';

export const ORDER_REALTIME_NAMESPACE = '/orders';
export const ORDER_JOIN_EVENT = 'order.join';
export const ORDER_LEAVE_EVENT = 'order.leave';
export const ORDER_STATUS_UPDATED_EVENT = 'order.status.updated';
export const ORDER_REALTIME_ERROR_EVENT = 'order.error';

export type OrderStatusUpdatedEvent = {
  orderId: string;
  status: OrderStatus;
  updatedAt: string;
};

export type OrderRoomRequest = { orderId: string };
export type OrderRoomResponse =
  | { ok: true; orderId: string }
  | {
      ok: false;
      code: 'INVALID_ORDER' | 'FORBIDDEN' | 'NOT_FOUND';
      message: string;
    };

export const orderRoom = (orderId: string) => `order:${orderId}`;
