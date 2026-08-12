import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as argon2 from 'argon2';
import {
  OrderStatus,
  PaymentStatus,
  Prisma,
  Role,
} from '../../../../prisma/generated/client/client';
import { canTransition } from '../orders/order-rules';
import { PrismaService } from '../prisma/prisma.service';
import { OrderEventsGateway } from '../realtime/order-events.gateway';
import type {
  AdminOrdersQueryDto,
  AdminProductsQueryDto,
  CreateCategoryDto,
  CreateOptionValueDto,
  CreateProductDto,
  CreateProductOptionDto,
  CreateStaffDto,
  UpdateCategoryDto,
  UpdateOptionValueDto,
  UpdateProductDto,
  UpdateProductOptionDto,
  UpdateRestaurantSettingsDto,
  UpdateStaffRoleDto,
} from './dto/admin.dto';

const orderInclude = {
  user: {
    select: { id: true, name: true, email: true, phone: true, createdAt: true },
  },
  items: true,
  payment: true,
  statusHistory: {
    orderBy: { createdAt: 'asc' as const },
    include: { changedBy: { select: { id: true, name: true, role: true } } },
  },
};

const productInclude = {
  category: true,
  options: {
    orderBy: { sortOrder: 'asc' as const },
    include: { values: { orderBy: { sortOrder: 'asc' as const } } },
  },
};

function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function startOfWeek() {
  const date = startOfToday();
  const day = date.getDay() || 7;
  date.setDate(date.getDate() - day + 1);
  return date;
}

function requireValidNewImageUrl(value?: string, current?: string | null) {
  const candidate = value?.trim();
  if (!candidate || candidate === current) return;
  if (/^data:image\/(png|jpeg|webp);base64,[a-z0-9+/=]+$/i.test(candidate))
    return;
  try {
    const url = new URL(candidate);
    if (url.protocol !== 'http:' && url.protocol !== 'https:')
      throw new Error();
  } catch {
    throw new BadRequestException(
      'L’image doit utiliser une URL HTTP ou HTTPS valide.',
    );
  }
}

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly orderEvents: OrderEventsGateway,
  ) {}

  async dashboard() {
    const today = startOfToday();
    const [todayOrders, grouped, revenue, recentOrders, actionOrders] =
      await this.prisma.$transaction([
        this.prisma.order.count({ where: { createdAt: { gte: today } } }),
        this.prisma.order.findMany({
          where: { createdAt: { gte: today } },
          select: { status: true },
        }),
        this.prisma.order.aggregate({
          where: { createdAt: { gte: today }, status: OrderStatus.COMPLETED },
          _sum: { total: true },
        }),
        this.prisma.order.findMany({
          include: orderInclude,
          orderBy: { createdAt: 'desc' },
          take: 8,
        }),
        this.prisma.order.findMany({
          where: {
            status: {
              in: [
                OrderStatus.PENDING,
                OrderStatus.CONFIRMED,
                OrderStatus.PREPARING,
              ],
            },
          },
          include: orderInclude,
          orderBy: { createdAt: 'asc' },
          take: 12,
        }),
      ]);
    const counts = Object.fromEntries(
      Object.values(OrderStatus).map((status) => [status, 0]),
    ) as Record<OrderStatus, number>;
    for (const row of grouped) counts[row.status] += 1;
    return {
      date: today,
      todayOrders,
      counts,
      todayRevenue: revenue._sum.total ?? new Prisma.Decimal(0),
      recentOrders,
      actionOrders,
    };
  }

  async orders(query: AdminOrdersQueryDto) {
    const search = query.search?.trim();
    const where: Prisma.OrderWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(search
        ? {
            OR: [
              { orderNumber: { contains: search, mode: 'insensitive' } },
              { user: { name: { contains: search, mode: 'insensitive' } } },
              { user: { email: { contains: search, mode: 'insensitive' } } },
            ],
          }
        : {}),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where,
        include: orderInclude,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.order.count({ where }),
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

  async order(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: orderInclude,
    });
    if (!order) throw new NotFoundException('Commande introuvable.');
    return order;
  }

  async updateOrderStatus(id: string, nextStatus: OrderStatus, userId: string) {
    const order = await this.prisma.$transaction(async (tx) => {
      const current = await tx.order.findUnique({
        where: { id },
        select: { status: true, payment: { select: { method: true } } },
      });
      if (!current) throw new NotFoundException('Commande introuvable.');
      if (!canTransition(current.status, nextStatus))
        throw new BadRequestException(
          `Transition ${current.status} → ${nextStatus} non autorisée.`,
        );
      return tx.order.update({
        where: { id },
        data: {
          status: nextStatus,
          ...(nextStatus === OrderStatus.COMPLETED
            ? { payment: { update: { status: PaymentStatus.PAID } } }
            : nextStatus === OrderStatus.CANCELLED &&
                current.payment?.method === 'ONLINE'
              ? { payment: { update: { status: PaymentStatus.REFUNDED } } }
              : {}),
          statusHistory: {
            create: {
              previousStatus: current.status,
              newStatus: nextStatus,
              changedByUserId: userId,
            },
          },
        },
        include: orderInclude,
      });
    });
    this.orderEvents.emitStatusUpdated({
      orderId: order.id,
      status: order.status,
      updatedAt: order.updatedAt.toISOString(),
    });
    return order;
  }

  categories() {
    return this.prisma.category.findMany({
      include: { _count: { select: { products: true } } },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  async createCategory(dto: CreateCategoryDto) {
    requireValidNewImageUrl(dto.imageUrl);
    const name = dto.name.trim();
    if (
      await this.prisma.category.findFirst({
        where: { name: { equals: name, mode: 'insensitive' } },
        select: { id: true },
      })
    )
      throw new ConflictException('Une catégorie porte déjà ce nom.');
    return this.prisma.category.create({
      data: {
        ...dto,
        name,
        description: dto.description?.trim() || null,
        imageUrl: dto.imageUrl?.trim() || null,
      },
    });
  }

  async updateCategory(id: string, dto: UpdateCategoryDto) {
    const current = await this.prisma.category.findUnique({
      where: { id },
      select: { id: true, imageUrl: true },
    });
    if (!current) throw new NotFoundException('Catégorie introuvable.');
    requireValidNewImageUrl(dto.imageUrl, current.imageUrl);
    if (dto.name) {
      const duplicate = await this.prisma.category.findFirst({
        where: {
          id: { not: id },
          name: { equals: dto.name.trim(), mode: 'insensitive' },
        },
        select: { id: true },
      });
      if (duplicate)
        throw new ConflictException('Une catégorie porte déjà ce nom.');
    }
    return this.prisma.category.update({
      where: { id },
      data: {
        ...dto,
        name: dto.name?.trim(),
        description:
          dto.description === undefined
            ? undefined
            : dto.description.trim() || null,
        imageUrl:
          dto.imageUrl === undefined ? undefined : dto.imageUrl.trim() || null,
      },
    });
  }

  async products(query: AdminProductsQueryDto) {
    const search = query.search?.trim();
    const where: Prisma.ProductWhereInput = {
      ...(query.categoryId ? { categoryId: query.categoryId } : {}),
      ...(query.available === undefined
        ? {}
        : { isAvailable: query.available }),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { description: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        include: productInclude,
        orderBy: [{ category: { sortOrder: 'asc' } }, { name: 'asc' }],
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

  async product(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: productInclude,
    });
    if (!product) throw new NotFoundException('Produit introuvable.');
    return product;
  }

  async createProduct(dto: CreateProductDto) {
    requireValidNewImageUrl(dto.imageUrl);
    await this.requireCategory(dto.categoryId);
    return this.prisma.product.create({
      data: {
        ...dto,
        name: dto.name.trim(),
        description: dto.description.trim(),
        imageUrl: dto.imageUrl?.trim() || null,
      },
      include: productInclude,
    });
  }

  async updateProduct(id: string, dto: UpdateProductDto) {
    const current = await this.product(id);
    requireValidNewImageUrl(dto.imageUrl, current.imageUrl);
    if (dto.categoryId) await this.requireCategory(dto.categoryId);
    return this.prisma.product.update({
      where: { id },
      data: {
        ...dto,
        name: dto.name?.trim(),
        description: dto.description?.trim(),
        imageUrl:
          dto.imageUrl === undefined ? undefined : dto.imageUrl.trim() || null,
      },
      include: productInclude,
    });
  }

  async createProductOption(productId: string, dto: CreateProductOptionDto) {
    await this.product(productId);
    return this.prisma.productOption.create({
      data: {
        productId,
        name: dto.name.trim(),
        sortOrder: dto.sortOrder,
        isActive: dto.isActive,
        values: dto.values
          ? {
              create: dto.values.map((value) => ({
                ...value,
                label: value.label.trim(),
              })),
            }
          : undefined,
      },
      include: { values: { orderBy: { sortOrder: 'asc' } } },
    });
  }

  async updateProductOption(id: string, dto: UpdateProductOptionDto) {
    await this.requireOption(id);
    return this.prisma.productOption.update({
      where: { id },
      data: { ...dto, name: dto.name?.trim() },
      include: { values: { orderBy: { sortOrder: 'asc' } } },
    });
  }

  async createOptionValue(optionId: string, dto: CreateOptionValueDto) {
    await this.requireOption(optionId);
    return this.prisma.productOptionValue.create({
      data: { ...dto, optionId, label: dto.label.trim() },
    });
  }

  async updateOptionValue(id: string, dto: UpdateOptionValueDto) {
    const value = await this.prisma.productOptionValue.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!value) throw new NotFoundException('Supplément introuvable.');
    return this.prisma.productOptionValue.update({
      where: { id },
      data: { ...dto, label: dto.label?.trim() },
    });
  }

  async customers() {
    const customers = await this.prisma.user.findMany({
      where: { role: Role.CUSTOMER },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        createdAt: true,
        orders: { select: { total: true, status: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return customers.map(({ orders, ...customer }) => ({
      ...customer,
      orderCount: orders.length,
      completedOrderCount: orders.filter(
        (order) => order.status === OrderStatus.COMPLETED,
      ).length,
      revenue: orders
        .filter((order) => order.status === OrderStatus.COMPLETED)
        .reduce((sum, order) => sum.add(order.total), new Prisma.Decimal(0)),
    }));
  }

  async reports() {
    const today = startOfToday();
    const week = startOfWeek();
    const [
      ordersToday,
      ordersWeek,
      revenueToday,
      revenueWeek,
      grouped,
      soldItems,
    ] = await this.prisma.$transaction([
      this.prisma.order.count({ where: { createdAt: { gte: today } } }),
      this.prisma.order.count({ where: { createdAt: { gte: week } } }),
      this.prisma.order.aggregate({
        where: { createdAt: { gte: today }, status: OrderStatus.COMPLETED },
        _sum: { total: true },
      }),
      this.prisma.order.aggregate({
        where: { createdAt: { gte: week }, status: OrderStatus.COMPLETED },
        _sum: { total: true },
      }),
      this.prisma.order.findMany({
        where: { createdAt: { gte: week } },
        select: { status: true },
      }),
      this.prisma.orderItem.findMany({
        where: {
          order: {
            createdAt: { gte: week },
            status: { not: OrderStatus.CANCELLED },
          },
        },
        select: { productNameSnapshot: true, quantity: true, subtotal: true },
      }),
    ]);
    const best = new Map<
      string,
      { name: string; quantity: number; revenue: Prisma.Decimal }
    >();
    for (const item of soldItems) {
      const current = best.get(item.productNameSnapshot) ?? {
        name: item.productNameSnapshot,
        quantity: 0,
        revenue: new Prisma.Decimal(0),
      };
      current.quantity += item.quantity;
      current.revenue = current.revenue.add(item.subtotal);
      best.set(item.productNameSnapshot, current);
    }
    const ordersByStatus = Object.values(OrderStatus).map((status) => ({
      status,
      count: grouped.filter((order) => order.status === status).length,
    }));
    return {
      period: { today, week },
      ordersToday,
      ordersWeek,
      revenueToday: revenueToday._sum.total ?? new Prisma.Decimal(0),
      revenueWeek: revenueWeek._sum.total ?? new Prisma.Decimal(0),
      ordersByStatus,
      bestSellingProducts: [...best.values()]
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 10),
    };
  }

  settings() {
    return this.prisma.restaurantSettings.upsert({
      where: { id: 'default' },
      update: {},
      create: { id: 'default' },
    });
  }

  async updateSettings(dto: UpdateRestaurantSettingsDto) {
    const data = {
      ...dto,
      restaurantName: dto.restaurantName?.trim(),
      address: dto.address?.trim(),
      contactPhone:
        dto.contactPhone === undefined
          ? undefined
          : dto.contactPhone.trim() || null,
      contactEmail:
        dto.contactEmail === undefined
          ? undefined
          : dto.contactEmail.trim().toLowerCase() || null,
    };
    return this.prisma.restaurantSettings.upsert({
      where: { id: 'default' },
      update: data,
      create: { id: 'default', ...data },
    });
  }

  async staff() {
    return this.prisma.user.findMany({
      where: { role: { in: [Role.STAFF, Role.MANAGER, Role.ADMIN] } },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
      },
      orderBy: [{ role: 'desc' }, { name: 'asc' }],
    });
  }

  async createStaff(dto: CreateStaffDto) {
    if (dto.role !== Role.STAFF && dto.role !== Role.MANAGER)
      throw new BadRequestException(
        'Un nouveau membre doit être Équipe ou Manager.',
      );
    const email = dto.email.trim().toLowerCase();
    if (
      await this.prisma.user.findUnique({
        where: { email },
        select: { id: true },
      })
    )
      throw new ConflictException(
        'Un compte utilise déjà cette adresse e-mail.',
      );
    return this.prisma.user.create({
      data: {
        name: dto.name.trim(),
        email,
        phone: dto.phone?.trim() || null,
        role: dto.role,
        passwordHash: await argon2.hash(dto.password, {
          type: argon2.argon2id,
        }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
      },
    });
  }

  async updateStaffRole(id: string, dto: UpdateStaffRoleDto) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, role: true },
    });
    if (!user) throw new NotFoundException('Membre de l’équipe introuvable.');
    if (user.role === Role.ADMIN)
      throw new BadRequestException(
        'Le rôle du compte Administrateur principal est protégé.',
      );
    if (dto.role !== Role.STAFF && dto.role !== Role.MANAGER)
      throw new BadRequestException('Le rôle doit être Équipe ou Manager.');
    return this.prisma.user.update({
      where: { id },
      data: { role: dto.role, refreshTokenHash: null },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
      },
    });
  }

  private async requireCategory(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!category) throw new NotFoundException('Catégorie introuvable.');
    return category;
  }

  private async requireOption(id: string) {
    const option = await this.prisma.productOption.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!option) throw new NotFoundException('Option introuvable.');
    return option;
  }
}
