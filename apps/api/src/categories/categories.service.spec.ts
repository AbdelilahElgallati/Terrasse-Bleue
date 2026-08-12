import { CategoriesService } from './categories.service';
describe('CategoriesService', () => {
  it('returns only active categories in menu order', async () => {
    const prisma = {
      category: { findMany: jest.fn().mockResolvedValue([{ id: 'one' }]) },
    } as any;
    await expect(new CategoriesService(prisma).findAll()).resolves.toHaveLength(
      1,
    );
    expect(prisma.category.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { isActive: true } }),
    );
  });
});
