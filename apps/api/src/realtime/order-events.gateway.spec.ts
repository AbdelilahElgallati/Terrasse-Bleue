import { OrderStatus, Role } from '../../../../prisma/generated/client/enums';
import { OrderEventsGateway } from './order-events.gateway';
import {
  ORDER_REALTIME_ERROR_EVENT,
  ORDER_STATUS_UPDATED_EVENT,
  orderRoom,
} from './order-events';

const ownOrderId = '10000000-0000-4000-8000-000000000001';
const otherOrderId = '10000000-0000-4000-8000-000000000002';

function setup() {
  const jwt = { verifyAsync: jest.fn() };
  const config = { getOrThrow: jest.fn().mockReturnValue('test-secret') };
  const prisma = { order: { findFirst: jest.fn() } };
  const gateway = new OrderEventsGateway(
    jwt as any,
    config as any,
    prisma as any,
  );
  const server = { to: jest.fn().mockReturnThis(), emit: jest.fn() };
  gateway.server = server as any;
  const socket = {
    data: {},
    handshake: { auth: {}, headers: {} },
    emit: jest.fn(),
    disconnect: jest.fn(),
    join: jest.fn(),
    leave: jest.fn(),
  } as any;
  return { gateway, jwt, prisma, server, socket };
}

describe('OrderEventsGateway', () => {
  it('starts with its dependencies', () =>
    expect(setup().gateway).toBeDefined());

  it('authenticates a customer from the verified JWT', async () => {
    const { gateway, jwt, socket } = setup();
    socket.handshake.auth.token = 'access-token';
    jwt.verifyAsync.mockResolvedValue({
      id: 'customer-a',
      email: 'a@test.local',
      role: Role.CUSTOMER,
    });
    await gateway.handleConnection(socket);
    expect(socket.data.user.id).toBe('customer-a');
    expect(jwt.verifyAsync).toHaveBeenCalledWith('access-token', {
      secret: 'test-secret',
    });
    expect(socket.disconnect).not.toHaveBeenCalled();
  });

  it('rejects an unauthenticated connection', async () => {
    const { gateway, socket } = setup();
    await gateway.handleConnection(socket);
    expect(socket.emit).toHaveBeenCalledWith(
      ORDER_REALTIME_ERROR_EVENT,
      expect.objectContaining({ code: 'AUTH_REQUIRED' }),
    );
    expect(socket.disconnect).toHaveBeenCalledWith(true);
  });

  it('joins only an owned customer order room', async () => {
    const { gateway, prisma, socket } = setup();
    socket.data.user = {
      id: 'customer-a',
      email: 'a@test.local',
      role: Role.CUSTOMER,
    };
    prisma.order.findFirst
      .mockResolvedValueOnce({ id: ownOrderId })
      .mockResolvedValueOnce(null);
    await expect(
      gateway.joinOrder(socket, { orderId: ownOrderId }),
    ).resolves.toEqual({ ok: true, orderId: ownOrderId });
    expect(socket.join).toHaveBeenCalledWith(orderRoom(ownOrderId));
    await expect(
      gateway.joinOrder(socket, { orderId: otherOrderId }),
    ).resolves.toMatchObject({ ok: false, code: 'FORBIDDEN' });
    expect(socket.join).not.toHaveBeenCalledWith(orderRoom(otherOrderId));
    expect(prisma.order.findFirst).toHaveBeenLastCalledWith({
      where: { id: otherOrderId, userId: 'customer-a' },
      select: { id: true },
    });
  });

  it('allows staff operational access to an existing order', async () => {
    const { gateway, prisma, socket } = setup();
    socket.data.user = {
      id: 'staff-a',
      email: 'staff@test.local',
      role: Role.STAFF,
    };
    prisma.order.findFirst.mockResolvedValue({ id: otherOrderId });
    await expect(
      gateway.joinOrder(socket, { orderId: otherOrderId }),
    ).resolves.toEqual({ ok: true, orderId: otherOrderId });
    expect(prisma.order.findFirst).toHaveBeenCalledWith({
      where: { id: otherOrderId },
      select: { id: true },
    });
    expect(socket.join).toHaveBeenCalledWith(orderRoom(otherOrderId));
  });

  it('safely rejects malformed room requests', async () => {
    const { gateway, socket } = setup();
    socket.data.user = {
      id: 'customer-a',
      email: 'a@test.local',
      role: Role.CUSTOMER,
    };
    await expect(
      gateway.joinOrder(socket, { orderId: 'not-a-uuid' }),
    ).resolves.toMatchObject({ ok: false, code: 'INVALID_ORDER' });
    expect(socket.join).not.toHaveBeenCalled();
  });

  it('emits only the server-confirmed status payload to the order room', () => {
    const { gateway, server } = setup();
    const event = {
      orderId: ownOrderId,
      status: OrderStatus.CONFIRMED,
      updatedAt: '2026-08-10T12:00:00.000Z',
    };
    gateway.emitStatusUpdated(event);
    expect(server.to).toHaveBeenCalledWith(orderRoom(ownOrderId));
    expect(server.emit).toHaveBeenCalledWith(ORDER_STATUS_UPDATED_EVENT, event);
  });
});
