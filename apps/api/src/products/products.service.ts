import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { ListProductsDto } from './dto/list-products.dto';

const include = {
  category: true,
  options: {
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' as const },
    include: {
      values: {
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' as const },
      },
    },
  },
};
@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}
  async findAll(query: ListProductsDto) {
    const where = {
      category: { isActive: true },
      ...(query.categoryId ? { categoryId: query.categoryId } : {}),
      ...(query.available ? { isAvailable: true } : {}),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        include,
        orderBy: [{ isFeatured: 'desc' }, { name: 'asc' }],
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.product.count({ where }),
    ]);
    return {
      items,
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        pages: Math.ceil(total / query.limit),
      },
    };
  }
  async findOne(id: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, isAvailable: true, category: { isActive: true } },
      include,
    });
    if (!product)
      throw new NotFoundException('Produit introuvable ou indisponible.');
    return product;
  }
}
