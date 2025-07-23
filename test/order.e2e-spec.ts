import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import {
  INestApplication,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { PrismaClient } from 'generated/prisma';
import * as bcrypt from 'bcrypt';
import { AppExceptionsFilter } from 'src/shared/filters/app-exception.filter';
import { ResponseInterceptor } from 'src/shared/interceptors/response.interceptor';
import { loginType, responseType } from 'src/shared/types/response.type';
import { BuyResponse } from 'src/shared/types/buy-response.type';

const generateUsername = (prefix = 'user') =>
  `${prefix}_${Math.random().toString(36).substring(2, 6)}`;

describe('OrderController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaClient;

  let sellerToken: string;
  let buyerToken: string;
  let buyerId: number;
  let productId: number;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    app.useGlobalFilters(new AppExceptionsFilter());
    app.useGlobalInterceptors(new ResponseInterceptor());
    app.enableVersioning({ type: VersioningType.URI });
    app.setGlobalPrefix('api');
    await app.init();

    prisma = new PrismaClient();

    // === Create SELLER ===
    const sellerUsername = generateUsername('seller');
    const sellerPassword = await bcrypt.hash('secret123', 10);

    await prisma.user.create({
      data: {
        username: sellerUsername,
        password: sellerPassword,
        role: 'SELLER',
      },
    });

    const sellerLoginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ username: sellerUsername, password: 'secret123' });

    sellerToken = ((sellerLoginRes.body as responseType).data as loginType)
      .access_token;

    // === Create Product ===
    await request(app.getHttpServer())
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({
        productName: 'Chocolate Bar',
        cost: 50,
        amountAvailable: 20,
      })
      .expect(201);

    const product = await prisma.product.findFirst({
      where: { productName: 'Chocolate Bar' },
    });
    productId = product!.id;

    // === Create BUYER ===
    const buyerUsername = generateUsername('buyer');
    const buyerPassword = await bcrypt.hash('secret123', 10);

    await prisma.user.create({
      data: {
        username: buyerUsername,
        password: buyerPassword,
        role: 'BUYER',
      },
    });

    const buyerLoginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ username: buyerUsername, password: 'secret123' });

    buyerToken = ((buyerLoginRes.body as responseType).data as loginType)
      .access_token;

    const buyer = await prisma.user.findUnique({
      where: { username: buyerUsername },
    });
    buyerId = buyer!.id;

    // === Deposit to BUYER ===
    await request(app.getHttpServer())
      .post('/api/v1/deposit')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ cents: 100 }) // Enough to buy 3 units at 50 cents each
      .expect(201);
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  it('should allow buyer to buy products', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/order/buy')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({
        items: [
          {
            id: productId,
            amount: 2,
          },
        ],
      })
      .expect(201);

    expect((res.body as responseType).success).toBe(true);
    expect((res.body as responseType).statusCode).toBe(200);

    const data = (res.body as responseType).data as BuyResponse;
    expect(data.totalSpent).toBe(100);
    expect(data.remainingDeposit).toBe(0);
    expect(data.items).toEqual([
      {
        id: productId,
        productName: 'Chocolate Bar',
        quantityBought: 2,
      },
    ]);

    const buyer = await prisma.user.findUnique({ where: { id: buyerId } });
    expect(buyer!.deposit).toBe(0);

    const product = await prisma.product.findUnique({
      where: { id: productId },
    });
    expect(product!.amountAvailable).toBe(18);
  });
});
