import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateOrderDto } from './create-order.dto';

const productId = '20000000-0000-4000-8000-000000000001';
const optionId = '30000000-0000-4000-8000-000000000001';
const valueId = '40000000-0000-4000-8000-000000000001';

describe('CreateOrderDto', () => {
  it('accepts bounded quantities and UUID option selections', async () => {
    const dto = plainToInstance(CreateOrderDto, {
      items: [
        { productId, quantity: 2, selectedOptions: { [optionId]: valueId } },
      ],
      orderType: 'DINE_IN',
      paymentMethod: 'CASH',
    });
    expect(await validate(dto)).toHaveLength(0);
  });

  it.each([
    [{ productId: 'bad-id', quantity: 1 }],
    [{ productId, quantity: 0 }],
    [{ productId, quantity: 21 }],
    [{ productId, quantity: 1, selectedOptions: { malformed: valueId } }],
    [{ productId, quantity: 1, selectedOptions: { [optionId]: 'malformed' } }],
  ])('rejects malformed order items %#', async (items) => {
    const dto = plainToInstance(CreateOrderDto, {
      items,
      orderType: 'DINE_IN',
      paymentMethod: 'CASH',
    });
    expect((await validate(dto)).length).toBeGreaterThan(0);
  });

  it('rejects client prices, totals, and identity fields', async () => {
    const dto = plainToInstance(CreateOrderDto, {
      items: [{ productId, quantity: 1, price: 0 }],
      orderType: 'DINE_IN',
      paymentMethod: 'CASH',
      total: 0,
      userId: 'customer-b',
    });
    expect(
      (await validate(dto, { whitelist: true, forbidNonWhitelisted: true }))
        .length,
    ).toBeGreaterThan(0);
  });
  it('accepts online payment', async () => {
    const dto = plainToInstance(CreateOrderDto, {
      items: [{ productId, quantity: 1 }],
      orderType: 'DINE_IN',
      paymentMethod: 'ONLINE',
    });
    expect(await validate(dto)).toHaveLength(0);
  });
  it('validates nested delivery details', async () => {
    const dto = plainToInstance(CreateOrderDto, {
      items: [{ productId, quantity: 1 }],
      orderType: 'DELIVERY',
      paymentMethod: 'CASH',
      deliveryAddress: {
        recipientName: 'Yasmine',
        phone: '0600000000',
        addressLine: '12 rue de la Médina',
        city: 'Essaouira',
      },
    });
    expect(await validate(dto)).toHaveLength(0);
  });
});
