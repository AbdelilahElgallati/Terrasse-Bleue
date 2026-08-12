import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { configureSecurity } from './../src/configure-security';
import { io, type Socket } from 'socket.io-client';
import type { AddressInfo } from 'node:net';
import { PrismaService } from './../src/prisma/prisma.service';
import { Role } from '../../../prisma/generated/client/enums';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;
  const customerPassword = process.env.E2E_CUSTOMER_PASSWORD;

  beforeEach(async () => {
    if (!customerPassword) throw new Error('E2E_CUSTOMER_PASSWORD is required for the database-backed E2E suite.');
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication<NestExpressApplication>();
    configureSecurity(app as NestExpressApplication);
    await app.listen(0, '127.0.0.1');
  });

  it('/health (GET)', () => {
    return request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect({ status: 'ok', service: 'terrasse-bleue-api' });
  });

  it('/admin/restaurant exposes synchronized service settings publicly', async () => {
    const response = await request(app.getHttpServer())
      .get('/admin/restaurant')
      .expect(200);
    expect(response.body).toMatchObject({
      restaurantName: 'Terrasse Bleue',
      isOpen: true,
      acceptsOrders: true,
      notificationSound: true,
    });
    expect(response.body.estimatedPrepMinutes).toBeGreaterThanOrEqual(5);
  });

  it('rejects an authenticated CUSTOMER from admin endpoints', async () => {
    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'client@terrassebleue.local',
        password: customerPassword,
      })
      .expect(201);
    await request(app.getHttpServer())
      .get('/admin/dashboard')
      .set('Authorization', `Bearer ${login.body.accessToken as string}`)
      .expect(403);
  }, 30_000);

  it('rejects missing and invalid access tokens', async () => {
    await request(app.getHttpServer()).get('/orders').expect(401);
    await request(app.getHttpServer())
      .get('/orders')
      .set('Authorization', 'Bearer invalid.jwt.token')
      .expect(401);
  });

  it('rejects malformed and client-authoritative order fields', async () => {
    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'client@terrassebleue.local',
        password: customerPassword,
      })
      .expect(201);
    await request(app.getHttpServer())
      .post('/orders')
      .set('Authorization', `Bearer ${login.body.accessToken as string}`)
      .send({
        items: [{ productId: 'not-a-uuid', quantity: 0, price: 0 }],
        orderType: 'DINE_IN',
        paymentMethod: 'CASH',
        total: 0,
        userId: 'another-user',
      })
      .expect(400);
  });

  it('prevents a CUSTOMER from mutating the menu', async () => {
    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'client@terrassebleue.local',
        password: customerPassword,
      })
      .expect(201);
    await request(app.getHttpServer())
      .post('/admin/categories')
      .set('Authorization', `Bearer ${login.body.accessToken as string}`)
      .send({ name: 'Interdit' })
      .expect(403);
  }, 30_000);

  it('runs customer order → admin transition → private realtime → history against PostgreSQL', async () => {
    const marker = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const customerEmail = `day6-customer-${marker}@test.local`;
    const adminEmail = `day6-admin-${marker}@test.local`;
    const password = 'Day6Secure123!';
    const prisma = app.get(PrismaService);
    let socket: Socket | undefined;
    let orderId: string | undefined;
    let customerId: string | undefined;
    let adminId: string | undefined;
    try {
      const customer = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ name: 'Day 6 Customer', email: customerEmail, password })
        .expect(201);
      customerId = customer.body.user.id as string;
      const admin = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ name: 'Day 6 Admin', email: adminEmail, password })
        .expect(201);
      adminId = admin.body.user.id as string;
      await prisma.user.update({
        where: { id: adminId },
        data: { role: Role.ADMIN },
      });
      const adminLogin = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: adminEmail, password })
        .expect(201);
      const menu = await request(app.getHttpServer())
        .get('/products?available=true&limit=1')
        .expect(200);
      const productId = menu.body.items[0]?.id as string;
      expect(productId).toBeTruthy();
      await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${customer.body.accessToken as string}`)
        .send({
          items: [{ productId, quantity: 1 }],
          orderType: 'TAKEAWAY',
          paymentMethod: 'ONLINE',
        })
        .expect(201)
        .expect(({ body }) => {
          expect(body.payment).toMatchObject({
            method: 'ONLINE',
            status: 'PAID',
          });
        });
      const created = await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${customer.body.accessToken as string}`)
        .send({
          items: [{ productId, quantity: 1 }],
          orderType: 'TAKEAWAY',
          paymentMethod: 'CASH',
        })
        .expect(201);
      orderId = created.body.id as string;
      await request(app.getHttpServer())
        .get(`/orders/${orderId}`)
        .set('Authorization', `Bearer ${admin.body.accessToken as string}`)
        .expect(404);
      const address = (
        app.getHttpServer() as unknown as { address(): AddressInfo }
      ).address();
      socket = io(`http://127.0.0.1:${address.port}/orders`, {
        transports: ['websocket'],
        auth: { token: customer.body.accessToken },
      });
      await new Promise<void>((resolve, reject) => {
        socket!.once('connect', resolve);
        socket!.once('connect_error', reject);
      });
      await new Promise<void>((resolve, reject) =>
        socket!.emit('order.join', { orderId }, (ack: { ok: boolean }) =>
          ack.ok ? resolve() : reject(new Error('room join failed')),
        ),
      );
      const event = new Promise<{
        orderId: string;
        status: string;
        updatedAt: string;
      }>((resolve, reject) => {
        const timer = setTimeout(
          () => reject(new Error('realtime event timeout')),
          5_000,
        );
        socket!.once('order.status.updated', (payload) => {
          clearTimeout(timer);
          resolve(payload);
        });
      });
      await request(app.getHttpServer())
        .patch(`/admin/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${adminLogin.body.accessToken as string}`)
        .send({ status: 'CONFIRMED' })
        .expect(200);
      await expect(event).resolves.toMatchObject({
        orderId,
        status: 'CONFIRMED',
      });
      const history = await request(app.getHttpServer())
        .get(`/orders/${orderId}`)
        .set('Authorization', `Bearer ${customer.body.accessToken as string}`)
        .expect(200);
      expect(history.body.status).toBe('CONFIRMED');
      expect(history.body.statusHistory).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ newStatus: 'CONFIRMED' }),
        ]),
      );
    } finally {
      socket?.disconnect();
      if (orderId) await prisma.order.deleteMany({ where: { id: orderId } });
      if (customerId || adminId)
        await prisma.user.deleteMany({
          where: {
            id: {
              in: [customerId, adminId].filter((id): id is string =>
                Boolean(id),
              ),
            },
          },
        });
    }
  }, 45_000);

  afterEach(async () => {
    await app.close();
  });
});
