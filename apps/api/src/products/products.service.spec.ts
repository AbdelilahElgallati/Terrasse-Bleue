import { NotFoundException } from '@nestjs/common';
import { ProductsService } from './products.service';
describe('ProductsService', () => {
  it('returns customer products with active-category and availability filters', async () => {
    const prisma = {
      product: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
      },
      $transaction: jest.fn(async (queries) => Promise.all(queries)),
    } as any;
    const service = new ProductsService(prisma);
    await service.findAll({ page: 1, limit: 20, available: true });
    expect(prisma.product.findMany.mock.calls[0][0].where).toMatchObject({
      isAvailable: true,
      category: { isActive: true },
    });
  });
  it('hides an unavailable product from customer detail', async () => {
    const prisma = {
      product: { findFirst: jest.fn().mockResolvedValue(null) },
    } as any;
    await expect(
      new ProductsService(prisma).findOne(
        '20000000-0000-4000-8000-000000000001',
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.product.findFirst.mock.calls[0][0].where.isAvailable).toBe(
      true,
    );
  });
});
