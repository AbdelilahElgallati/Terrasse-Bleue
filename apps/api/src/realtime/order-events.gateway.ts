import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';
import { Role } from '../../../../prisma/generated/client/enums';
import type { AuthUser } from '../common/auth-user';
import { PrismaService } from '../prisma/prisma.service';
import {
  ORDER_JOIN_EVENT,
  ORDER_LEAVE_EVENT,
  ORDER_REALTIME_ERROR_EVENT,
  ORDER_REALTIME_NAMESPACE,
  ORDER_STATUS_UPDATED_EVENT,
  orderRoom,
  type OrderRoomRequest,
  type OrderRoomResponse,
  type OrderStatusUpdatedEvent,
} from './order-events';

type GatewayEvents = Record<string, (...args: unknown[]) => void>;
type AuthenticatedSocket = Socket<
  GatewayEvents,
  GatewayEvents,
  GatewayEvents,
  { user?: AuthUser }
>;

@Injectable()
@WebSocketGateway({
  namespace: ORDER_REALTIME_NAMESPACE,
  transports: ['websocket', 'polling'],
})
export class OrderEventsGateway implements OnGatewayConnection {
  @WebSocketServer() server!: Server;
  private readonly logger = new Logger(OrderEventsGateway.name);

  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    const token = this.extractToken(client);
    if (!token)
      return this.reject(client, 'AUTH_REQUIRED', 'Authentification requise.');
    try {
      client.data.user = await this.jwt.verifyAsync<AuthUser>(token, {
        secret: this.config.getOrThrow('JWT_ACCESS_SECRET'),
      });
    } catch {
      return this.reject(
        client,
        'AUTH_INVALID',
        'Session invalide ou expirée.',
      );
    }
  }

  @SubscribeMessage(ORDER_JOIN_EVENT)
  async joinOrder(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() request: OrderRoomRequest,
  ): Promise<OrderRoomResponse> {
    const user = client.data.user;
    if (!user)
      return {
        ok: false,
        code: 'FORBIDDEN',
        message: 'Authentification requise.',
      };
    if (!request || !this.isUuid(request.orderId))
      return {
        ok: false,
        code: 'INVALID_ORDER',
        message: 'Identifiant de commande invalide.',
      };

    const staff = new Set<Role>([Role.ADMIN, Role.MANAGER, Role.STAFF]).has(
      user.role,
    );
    const order = await this.prisma.order.findFirst({
      where: { id: request.orderId, ...(staff ? {} : { userId: user.id }) },
      select: { id: true },
    });
    if (!order) {
      const response: OrderRoomResponse = staff
        ? { ok: false, code: 'NOT_FOUND', message: 'Commande introuvable.' }
        : {
            ok: false,
            code: 'FORBIDDEN',
            message: 'Accès à cette commande refusé.',
          };
      client.emit(ORDER_REALTIME_ERROR_EVENT, response);
      return response;
    }
    await client.join(orderRoom(order.id));
    return { ok: true, orderId: order.id };
  }

  @SubscribeMessage(ORDER_LEAVE_EVENT)
  async leaveOrder(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() request: OrderRoomRequest,
  ): Promise<OrderRoomResponse> {
    if (!request || !this.isUuid(request.orderId))
      return {
        ok: false,
        code: 'INVALID_ORDER',
        message: 'Identifiant de commande invalide.',
      };
    await client.leave(orderRoom(request.orderId));
    return { ok: true, orderId: request.orderId };
  }

  emitStatusUpdated(event: OrderStatusUpdatedEvent) {
    this.server
      .to(orderRoom(event.orderId))
      .emit(ORDER_STATUS_UPDATED_EVENT, event);
  }

  private extractToken(client: Socket) {
    const authToken = (client.handshake.auth as Record<string, unknown>).token;
    if (typeof authToken === 'string' && authToken) return authToken;
    const authorization = client.handshake.headers.authorization;
    if (
      typeof authorization === 'string' &&
      authorization.startsWith('Bearer ')
    )
      return authorization.slice(7);
    return undefined;
  }

  private reject(client: Socket, code: string, message: string) {
    this.logger.warn(`Socket authentication rejected: ${code}`);
    client.emit(ORDER_REALTIME_ERROR_EVENT, { code, message });
    client.disconnect(true);
  }

  private isUuid(value: unknown): value is string {
    return (
      typeof value === 'string' &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        value,
      )
    );
  }
}
