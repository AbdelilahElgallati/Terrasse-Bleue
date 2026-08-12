import { BadRequestException, NotFoundException } from '@nestjs/common';
import {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  Prisma,
} from '../../../../prisma/generated/client/client';
import { OrdersService } from './orders.service';

type TestProduct = {
  id: string;
  name: string;
  price: Prisma.Decimal;
  isAvailable: boolean;
  category: { isActive: boolean };
  options: Array<{
    id: string;
    name: string;
    isActive: boolean;
    values: Array<{
      id: string;
      label: string;
      isActive: boolean;
      priceDelta: Prisma.Decimal;
    }>;
  }>;
};
const product: TestProduct = {
  id: '20000000-0000-4000-8000-000000000001',
  name: 'Thé à la menthe',
  price: new Prisma.Decimal(24),
  isAvailable: true,
  category: { isActive: true },
  options: [],
};
function setup(products = [product]) {
  const orderEvents = { emitStatusUpdated: jest.fn() };
  const prisma = {
    restaurantSettings: { findUnique: jest.fn().mockResolvedValue(null) },
    product: { findMany: jest.fn().mockResolvedValue(products) },
    order: {
      create: jest
        .fn()
        .mockImplementation(({ data }) => ({ id: 'order-1', ...data })),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  } as any;
  return {
    prisma,
    orderEvents,
    service: new OrdersService(prisma, orderEvents as any),
  };
}
describe('Restaurant availability', () => {
  it('rejects orders while the restaurant is closed', async () => {
    const { service, prisma } = setup();
    prisma.restaurantSettings.findUnique.mockResolvedValue({
      isOpen: false,
      acceptsOrders: true,
      estimatedPrepMinutes: 25,
    });
    await expect(
      service.create('user-1', {
        items: [{ productId: product.id, quantity: 1 }],
        orderType: 'DINE_IN',
        paymentMethod: PaymentMethod.CASH,
      }),
    ).rejects.toThrow('restaurant est actuellement fermé');
  });
  it('rejects orders while ordering is paused', async () => {
    const { service, prisma } = setup();
    prisma.restaurantSettings.findUnique.mockResolvedValue({
      isOpen: true,
      acceptsOrders: false,
      estimatedPrepMinutes: 35,
    });
    await expect(
      service.create('user-1', {
        items: [{ productId: product.id, quantity: 1 }],
        orderType: 'DINE_IN',
        paymentMethod: PaymentMethod.CASH,
      }),
    ).rejects.toThrow('temporairement en pause');
  });
});
describe('OrdersService', () => {
  it('calculates prices and creates history and payment on the server', async () => {
    const { service, prisma } = setup();
    await service.create('user-1', {
      items: [{ productId: product.id, quantity: 3 }],
      orderType: 'DINE_IN',
      paymentMethod: PaymentMethod.CASH,
    });
    const data = prisma.order.create.mock.calls[0][0].data;
    expect(data.userId).toBe('user-1');
    expect(data.subtotal.toNumber()).toBe(72);
    expect(data.total.toNumber()).toBe(72);
    expect(data.items.create[0]).toMatchObject({
      productNameSnapshot: product.name,
      quantity: 3,
    });
    expect(data.statusHistory.create.newStatus).toBe(OrderStatus.PENDING);
    expect(data.payment.create).toMatchObject({ method: PaymentMethod.CASH });
  });
  it('rejects nonexistent products', async () => {
    await expect(
      setup([]).service.create('user-1', {
        items: [{ productId: product.id, quantity: 1 }],
        orderType: 'DINE_IN',
        paymentMethod: PaymentMethod.CASH,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
  it('rejects unavailable products', async () => {
    await expect(
      setup([{ ...product, isAvailable: false }]).service.create('user-1', {
        items: [{ productId: product.id, quantity: 1 }],
        orderType: 'DINE_IN',
        paymentMethod: PaymentMethod.CASH,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
  it('rejects products from inactive categories', async () => {
    await expect(
      setup([{ ...product, category: { isActive: false } }]).service.create(
        'user-1',
        {
          items: [{ productId: product.id, quantity: 1 }],
          orderType: 'DINE_IN',
          paymentMethod: PaymentMethod.CASH,
        },
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
  it('calculates supplements and preserves historical option snapshots', async () => {
    const optionId = '30000000-0000-4000-8000-000000000001';
    const valueId = '40000000-0000-4000-8000-000000000001';
    const configured = {
      ...product,
      options: [
        {
          id: optionId,
          name: 'Supplément',
          isActive: true,
          values: [
            {
              id: valueId,
              label: 'Extra',
              isActive: true,
              priceDelta: new Prisma.Decimal(6),
            },
          ],
        },
      ],
    };
    const { service, prisma } = setup([configured]);
    await service.create('user-1', {
      items: [
        {
          productId: product.id,
          quantity: 2,
          selectedOptions: { [optionId]: valueId },
        },
      ],
      orderType: 'TAKEAWAY',
      paymentMethod: PaymentMethod.CASH,
    });
    const item = prisma.order.create.mock.calls[0][0].data.items.create[0];
    expect(item.unitPrice.toNumber()).toBe(30);
    expect(item.subtotal.toNumber()).toBe(60);
    expect(item.selectedOptions).toEqual([
      {
        optionId,
        optionName: 'Supplément',
        valueId,
        valueLabel: 'Extra',
        priceDelta: '6',
      },
    ]);
  });
  it('rejects products whose active options were not selected', async () => {
    const configured = {
      ...product,
      options: [
        {
          id: '30000000-0000-4000-8000-000000000001',
          name: 'Taille',
          isActive: true,
          values: [
            {
              id: '40000000-0000-4000-8000-000000000001',
              label: 'Grande',
              isActive: true,
              priceDelta: new Prisma.Decimal(5),
            },
          ],
        },
      ],
    };
    await expect(
      setup([configured]).service.create('user-1', {
        items: [{ productId: product.id, quantity: 1 }],
        orderType: 'DINE_IN',
        paymentMethod: PaymentMethod.CASH,
      }),
    ).rejects.toThrow('toutes les options requises');
  });
  it('persists online payment as paid', async () => {
    const { service, prisma } = setup();
    await service.create('user-1', {
      items: [{ productId: product.id, quantity: 1 }],
      orderType: 'DINE_IN',
      paymentMethod: PaymentMethod.ONLINE,
    });
    expect(
      prisma.order.create.mock.calls[0][0].data.payment.create,
    ).toMatchObject({
      method: PaymentMethod.ONLINE,
      status: PaymentStatus.PAID,
      provider: 'DEMO_CHECKOUT',
    });
  });
  it('adds the fixed delivery fee and address snapshot', async () => {
    const result = await setup().service.create('user-1', {
      items: [{ productId: product.id, quantity: 1 }],
      orderType: 'DELIVERY',
      paymentMethod: PaymentMethod.CASH,
      deliveryAddress: {
        recipientName: 'Yasmine',
        phone: '0600000000',
        addressLine: '12 rue de la Médina',
        city: 'Essaouira',
      },
    });
    expect(result.deliveryFee.toString()).toBe('25');
    expect(result.total.toString()).toBe('49');
    expect(result.deliveryAddress).toMatchObject({
      recipientName: 'Yasmine',
      city: 'Essaouira',
    });
  });
  it('rejects invalid or inactive option values', async () => {
    const optionId = '30000000-0000-4000-8000-000000000001';
    const configured = {
      ...product,
      options: [{ id: optionId, name: 'Option', isActive: true, values: [] }],
    };
    await expect(
      setup([configured]).service.create('user-1', {
        items: [
          {
            productId: product.id,
            quantity: 1,
            selectedOptions: {
              [optionId]: '40000000-0000-4000-8000-000000000099',
            },
          },
        ],
        orderType: 'DINE_IN',
        paymentMethod: PaymentMethod.CASH,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
  it('scopes order lookup to the authenticated user', async () => {
    const { service, prisma } = setup();
    prisma.order.findFirst.mockResolvedValue(null);
    await expect(service.findOne('user-a', 'order-b')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(prisma.order.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'order-b', userId: 'user-a' } }),
    );
  });
  it('rejects cancellation after preparation starts', async () => {
    const { service, prisma } = setup();
    prisma.order.findFirst.mockResolvedValue({
      id: 'order-1',
      userId: 'user-1',
      status: OrderStatus.PREPARING,
    });
    await expect(service.cancel('user-1', 'order-1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(prisma.order.update).not.toHaveBeenCalled();
  });
});
