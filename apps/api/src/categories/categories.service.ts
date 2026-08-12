import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}
  findAll() {
    return this.prisma.category.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  }
  async findOne(id: string) {
    const category = await this.prisma.category.findFirst({
      where: { id, isActive: true },
      include: {
        products: {
          where: { isAvailable: true },
          include: {
            options: {
              where: { isActive: true },
              orderBy: { sortOrder: 'asc' },
              include: {
                values: {
                  where: { isActive: true },
                  orderBy: { sortOrder: 'asc' },
                },
              },
            },
          },
        },
      },
    });
    if (!category) throw new NotFoundException('Catégorie introuvable.');
    return category;
  }
}
