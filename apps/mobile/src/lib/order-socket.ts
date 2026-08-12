import { io, type Socket } from 'socket.io-client';
import type { OrderStatus } from '@/types/menu';

export const ORDER_STATUS_UPDATED_EVENT = 'order.status.updated';
const ORDER_JOIN_EVENT = 'order.join';
const ORDER_LEAVE_EVENT = 'order.leave';

export type OrderStatusUpdatedEvent = {
  orderId: string;
  status: OrderStatus;
  updatedAt: string;
};

export type RealtimeConnectionState = 'disabled' | 'connecting' | 'connected' | 'disconnected' | 'unauthorized';
type StatusListener = (event: OrderStatusUpdatedEvent) => void;
type ConnectionListener = (state: RealtimeConnectionState) => void;

class OrderSocketClient {
  private socket?: Socket;
  private token?: string;
  private activeOrders = new Set<string>();
  private statusListeners = new Set<StatusListener>();
  private connectionListeners = new Set<ConnectionListener>();
  private state: RealtimeConnectionState = 'disabled';

  configure(token?: string) {
    if (this.token === token) return;
    this.token = token;
    if (!token) return this.disconnect();
    if (this.socket) {
      this.socket.auth = { token };
      if (this.socket.connected) this.socket.disconnect().connect();
      else if (this.activeOrders.size > 0) this.connect();
    }
  }

  connect() {
    if (!this.token) return this.setState('disabled');
    if (!this.socket) this.socket = this.createSocket();
    this.socket.auth = { token: this.token };
    if (!this.socket.connected) {
      this.setState('connecting');
      this.socket.connect();
    }
  }

  disconnect() {
    this.socket?.removeAllListeners();
    this.socket?.disconnect();
    this.socket = undefined;
    this.activeOrders.clear();
    this.setState('disabled');
  }

  pause() {
    this.socket?.disconnect();
    this.setState(this.token ? 'disconnected' : 'disabled');
  }

  subscribeOrder(orderId: string, listener: StatusListener) {
    this.activeOrders.add(orderId);
    this.statusListeners.add(listener);
    this.connect();
    if (this.socket?.connected) this.join(orderId);
    return () => {
      this.statusListeners.delete(listener);
      this.activeOrders.delete(orderId);
      if (this.socket?.connected) this.socket.emit(ORDER_LEAVE_EVENT, { orderId });
    };
  }

  onConnectionState(listener: ConnectionListener) {
    this.connectionListeners.add(listener);
    listener(this.state);
    return () => {
      this.connectionListeners.delete(listener);
    };
  }

  private createSocket() {
    const apiUrl = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '');
    const socket = io(`${apiUrl ?? ''}/orders`, {
      autoConnect: false,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1_000,
      reconnectionDelayMax: 10_000,
      timeout: 10_000,
      auth: { token: this.token },
    });
    socket.on('connect', () => {
      this.setState('connected');
      for (const orderId of this.activeOrders) this.join(orderId);
    });
    socket.on('disconnect', () => {
      if (this.state !== 'unauthorized') this.setState('disconnected');
    });
    socket.on('connect_error', (error) => {
      this.setState(/auth|jwt|session/i.test(error.message) ? 'unauthorized' : 'disconnected');
    });
    socket.on('order.error', (error: { code?: string }) => {
      if (error.code?.startsWith('AUTH_')) this.setState('unauthorized');
    });
    socket.on(ORDER_STATUS_UPDATED_EVENT, (event: unknown) => {
      if (!this.isStatusEvent(event)) return;
      for (const listener of this.statusListeners) listener(event);
    });
    return socket;
  }

  private join(orderId: string) {
    this.socket?.emit(ORDER_JOIN_EVENT, { orderId }, (response: { ok?: boolean }) => {
      if (!response?.ok) this.setState('disconnected');
    });
  }

  private setState(state: RealtimeConnectionState) {
    this.state = state;
    for (const listener of this.connectionListeners) listener(state);
  }

  private isStatusEvent(event: unknown): event is OrderStatusUpdatedEvent {
    if (!event || typeof event !== 'object') return false;
    const value = event as Record<string, unknown>;
    return typeof value.orderId === 'string' &&
      typeof value.updatedAt === 'string' &&
      ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED'].includes(String(value.status));
  }
}

export const orderSocket = new OrderSocketClient();
