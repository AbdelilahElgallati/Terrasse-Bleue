import { OrderStatus } from '../../../../prisma/generated/client/enums';

const transitions: Record<OrderStatus, OrderStatus[]> = {
  PENDING: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
  CONFIRMED: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
  PREPARING: [OrderStatus.READY],
  READY: [OrderStatus.COMPLETED],
  COMPLETED: [],
  CANCELLED: [],
};
export function canTransition(from: OrderStatus, to: OrderStatus) {
  return transitions[from].includes(to);
}
export function canCustomerCancel(status: OrderStatus) {
  return canTransition(status, OrderStatus.CANCELLED);
}
