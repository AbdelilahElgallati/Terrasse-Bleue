import { BadRequestException, NotFoundException } from '@nestjs/common';
import {
  OrderStatus,
  Prisma,
} from '../../../../prisma/generated/client/client';
import { AdminService } from './admin.service';

function setup() {
  const orderEvents = { emitStatusUpdated: jest.fn() };
  const prisma = {
    order: {
      count: jest.fn(),
      findMany: jest.fn(),
      aggregate: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    category: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    product: {
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    productOption: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    productOptionValue: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    orderItem: { findMany: jest.fn() },
    user: { findMany: jest.fn() },
    $transaction: jest.fn((input: unknown) =>
      typeof input === 'function'
        ? input(prisma)
        : Promise.all(input as Promise<unknown>[]),
    ),
  } as any;
  return {
    prisma,
    orderEvents,
    service: new AdminService(prisma, orderEvents as any),
  };
}

describe('AdminService', () => {
  it('applies a valid order transition with actor history', async () => {
    const { service, prisma, orderEvents } = setup();
    prisma.order.findUnique.mockResolvedValue({ status: OrderStatus.PENDING });
    prisma.order.update.mockResolvedValue({
      id: 'order-1',
      status: OrderStatus.CONFIRMED,
      updatedAt: new Date('2026-08-10T12:00:00.000Z'),
    });
    await expect(
      service.updateOrderStatus('order-1', OrderStatus.CONFIRMED, 'staff-1'),
    ).resolves.toMatchObject({ status: OrderStatus.CONFIRMED });
    expect(
      prisma.order.update.mock.calls[0][0].data.statusHistory.create,
    ).toMatchObject({
      previousStatus: OrderStatus.PENDING,
      newStatus: OrderStatus.CONFIRMED,
      changedByUserId: 'staff-1',
    });
    expect(orderEvents.emitStatusUpdated).toHaveBeenCalledWith({
      orderId: 'order-1',
      status: OrderStatus.CONFIRMED,
      updatedAt: '2026-08-10T12:00:00.000Z',
    });
  });
  it('rejects invalid order transitions', async () => {
    const { service, prisma, orderEvents } = setup();
    prisma.order.findUnique.mockResolvedValue({ status: OrderStatus.PENDING });
    await expect(
      service.updateOrderStatus('order-1', OrderStatus.READY, 'staff-1'),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.order.update).not.toHaveBeenCalled();
    expect(orderEvents.emitStatusUpdated).not.toHaveBeenCalled();
  });
  it('rejects a transition for a nonexistent order without emitting', async () => {
    const { service, prisma, orderEvents } = setup();
    prisma.order.findUnique.mockResolvedValue(null);
    await expect(
      service.updateOrderStatus(
        'missing-order',
        OrderStatus.CONFIRMED,
        'staff-1',
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.order.update).not.toHaveBeenCalled();
    expect(orderEvents.emitStatusUpdated).not.toHaveBeenCalled();
  });
  it('creates a category without destructive operations', async () => {
    const { service, prisma } = setup();
    prisma.category.findFirst.mockResolvedValue(null);
    prisma.category.create.mockResolvedValue({
      id: 'category-1',
      name: 'Boissons',
    });
    await service.createCategory({ name: ' Boissons ' });
    expect(prisma.category.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ name: 'Boissons' }),
      }),
    );
  });
  it('creates a product with server-validated category and supports activation changes', async () => {
    const { service, prisma } = setup();
    prisma.category.findUnique.mockResolvedValue({ id: 'category-1' });
    prisma.product.create.mockResolvedValue({ id: 'product-1' });
    await service.createProduct({
      categoryId: 'category-1',
      name: 'Café',
      description: 'Café frais',
      price: 20,
    });
    expect(prisma.product.create).toHaveBeenCalled();
    prisma.product.findUnique.mockResolvedValue({
      id: 'product-1',
      category: {},
      options: [],
    });
    prisma.product.update.mockResolvedValue({
      id: 'product-1',
      isAvailable: false,
    });
    await service.updateProduct('product-1', { isAvailable: false });
    expect(prisma.product.update.mock.calls[0][0].data.isAvailable).toBe(false);
  });
  it('calculates dashboard values from database results', async () => {
    const { service, prisma } = setup();
    prisma.order.count.mockResolvedValue(3);
    prisma.order.findMany
      .mockResolvedValueOnce([
        { status: OrderStatus.PENDING },
        { status: OrderStatus.COMPLETED },
      ])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
    prisma.order.aggregate.mockResolvedValue({
      _sum: { total: new Prisma.Decimal(120) },
    });
    const result = await service.dashboard();
    expect(result.todayOrders).toBe(3);
    expect(result.counts.PENDING).toBe(1);
    expect(result.todayRevenue.toString()).toBe('120');
  });
});
