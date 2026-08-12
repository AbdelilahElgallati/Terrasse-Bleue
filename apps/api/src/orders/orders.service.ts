import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomInt } from 'node:crypto';
import {
  OrderStatus,
  PaymentStatus,
  Prisma,
} from '../../../../prisma/generated/client/client';
import { PrismaService } from '../prisma/prisma.service';
import { OrderEventsGateway } from '../realtime/order-events.gateway';
import type { CreateOrderDto } from './dto/create-order.dto';
import type { ListOrdersDto } from './dto/list-orders.dto';
import { canCustomerCancel } from './order-rules';

const orderInclude = {
  items: true,
  payment: true,
  statusHistory: { orderBy: { createdAt: 'asc' as const } },
};
type ProductWithOptions = Prisma.ProductGetPayload<{
  include: { category: true; options: { include: { values: true } } };
}>;
@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly orderEvents: OrderEventsGateway,
  ) {}

  async create(userId: string, dto: CreateOrderDto) {
    if (dto.orderType === 'DELIVERY' && !dto.deliveryAddress)
      throw new BadRequestException('L’adresse de livraison est requise.');
    if (dto.orderType !== 'DELIVERY' && dto.deliveryAddress)
      throw new BadRequestException('L’adresse est réservée aux livraisons.');
    if (
      dto.deliveryAddress &&
      dto.deliveryAddress.city.trim().toLocaleLowerCase('fr') !== 'essaouira'
    )
      throw new BadRequestException(
        'La livraison est disponible uniquement à Essaouira.',
      );
    const service = await this.prisma.restaurantSettings.findUnique({
      where: { id: 'default' },
    });
    if (service && !service.isOpen)
      throw new BadRequestException(
        'Le restaurant est actuellement fermé. Consultez l’accueil pour nos informations de contact.',
      );
    if (service && !service.acceptsOrders)
      throw new BadRequestException(
        `Les commandes sont temporairement en pause. Temps de préparation estimé : ${service.estimatedPrepMinutes} min.`,
      );
    const ids = [...new Set(dto.items.map((item) => item.productId))];
    const products = await this.prisma.product.findMany({
      where: { id: { in: ids } },
      include: { category: true, options: { include: { values: true } } },
    });
    if (products.length !== ids.length)
      throw new BadRequestException(
        'Un ou plusieurs produits sont introuvables.',
      );
    const byId = new Map<string, ProductWithOptions>(
      products.map((product) => [product.id, product]),
    );
    const items = dto.items.map((item) => {
      const product = byId.get(item.productId)!;
      if (!product.isAvailable || !product.category.isActive)
        throw new BadRequestException(
          `Le produit « ${product.name} » est indisponible.`,
        );
      let unitPrice = product.price;
      const activeOptions = product.options.filter((option) => option.isActive);
      const selectedOptions = item.selectedOptions ?? {};
      if (activeOptions.some((option) => !selectedOptions[option.id]))
        throw new BadRequestException(
          `Choisissez toutes les options requises pour « ${product.name} ».`,
        );
      const selections: Array<{
        optionId: string;
        optionName: string;
        valueId: string;
        valueLabel: string;
        priceDelta: string;
      }> = [];
      for (const [optionId, valueId] of Object.entries(selectedOptions)) {
        const option = product.options.find((entry) => entry.id === optionId);
        const value = option?.values.find((entry) => entry.id === valueId);
        if (!option?.isActive || !value?.isActive)
          throw new BadRequestException(
            `Option invalide pour « ${product.name} ».`,
          );
        unitPrice = unitPrice.add(value.priceDelta);
        selections.push({
          optionId,
          optionName: option.name,
          valueId,
          valueLabel: value.label,
          priceDelta: value.priceDelta.toString(),
        });
      }
      return {
        productId: product.id,
        productNameSnapshot: product.name,
        unitPrice,
        quantity: item.quantity,
        subtotal: unitPrice.mul(item.quantity),
        selectedOptions: selections,
      };
    });
    const subtotal = items.reduce(
      (sum, item) => sum.add(item.subtotal),
      new Prisma.Decimal(0),
    );
    const deliveryFee =
      dto.orderType === 'DELIVERY'
        ? new Prisma.Decimal(25)
        : new Prisma.Decimal(0);
    const total = subtotal.add(deliveryFee);
    const orderNumber = `TB-${new Date().toISOString().slice(2, 10).replaceAll('-', '')}-${randomInt(1000, 10000)}`;
    return this.prisma.order.create({
      data: {
        orderNumber,
        userId,
        orderType: dto.orderType,
        subtotal,
        deliveryFee,
        total,
        deliveryAddress: dto.deliveryAddress
          ? {
              recipientName: dto.deliveryAddress.recipientName.trim(),
              phone: dto.deliveryAddress.phone.trim(),
              addressLine: dto.deliveryAddress.addressLine.trim(),
              neighborhood: dto.deliveryAddress.neighborhood?.trim() || '',
              landmark: dto.deliveryAddress.landmark?.trim() || '',
              instructions: dto.deliveryAddress.instructions?.trim() || '',
              city: 'Essaouira',
            }
          : undefined,
        notes: dto.notes?.trim() || null,
        items: { create: items },
        statusHistory: { create: { newStatus: OrderStatus.PENDING } },
        payment: {
          create: {
            method: dto.paymentMethod,
            status:
              dto.paymentMethod === 'ONLINE'
                ? PaymentStatus.PAID
                : PaymentStatus.PENDING,
            amount: total,
            provider: dto.paymentMethod === 'ONLINE' ? 'DEMO_CHECKOUT' : null,
            providerReference:
              dto.paymentMethod === 'ONLINE' ? `SIM-${orderNumber}` : null,
          },
        },
      },
      include: orderInclude,
    });
  }

  async findAll(userId: string, query: ListOrdersDto) {
    const [items, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where: { userId },
        include: orderInclude,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.order.count({ where: { userId } }),
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

  async findOne(userId: string, id: string) {
    const order = await this.prisma.order.findFirst({
      where: { id, userId },
      include: orderInclude,
    });
    if (!order) throw new NotFoundException('Commande introuvable.');
    return order;
  }

  async status(userId: string, id: string) {
    const order = await this.prisma.order.findFirst({
      where: { id, userId },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        updatedAt: true,
        statusHistory: { orderBy: { createdAt: 'asc' } },
      },
    });
    if (!order) throw new NotFoundException('Commande introuvable.');
    return order;
  }

  async cancel(userId: string, id: string) {
    const order = await this.findOne(userId, id);
    if (!canCustomerCancel(order.status))
      throw new BadRequestException(
        'Cette commande ne peut plus être annulée.',
      );
    const updated = await this.prisma.order.update({
      where: { id },
      data: {
        status: OrderStatus.CANCELLED,
        ...(order.payment?.method === 'ONLINE'
          ? { payment: { update: { status: PaymentStatus.REFUNDED } } }
          : {}),
        statusHistory: {
          create: {
            previousStatus: order.status,
            newStatus: OrderStatus.CANCELLED,
            changedByUserId: userId,
          },
        },
      },
      include: orderInclude,
    });
    this.orderEvents.emitStatusUpdated({
      orderId: updated.id,
      status: updated.status,
      updatedAt: updated.updatedAt.toISOString(),
    });
    return updated;
  }
}
