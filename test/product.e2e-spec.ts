import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import {
  INestApplication,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { PrismaClient, Product } from 'generated/prisma';
import { AppExceptionsFilter } from 'src/shared/filters/app-exception.filter';
import { ResponseInterceptor } from 'src/shared/interceptors/response.interceptor';
import {
  paginateResponseType,
  responseType,
  loginType,
} from 'src/shared/types/response.type';
import * as bcrypt from 'bcrypt';

const generateRandom = (prefix = 'seller') =>
  `${prefix}_${Math.random().toString(36).substring(2, 8)}`;

describe('ProductController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  let accessToken: string;
  let sellerId: number;

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

    // Create seller user
    const sellerUsername = generateRandom('seller');
    const password = await bcrypt.hash('secret123', 10);

    const user = await prisma.user.create({
      data: {
        username: sellerUsername,
        password, // Assumes plaintext or use a seed script with hashing
        role: 'SELLER',
      },
    });

    // Login to get token
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ username: sellerUsername, password: 'secret123' });

    accessToken = ((res.body as responseType).data as loginType).access_token; // Adjust if returned key is different
    sellerId = user.id;
  });

  afterAll(async () => {
    await prisma.product.deleteMany({});
    await prisma.user.deleteMany({});
    await app.close();
    await prisma.$disconnect();
  });

  it('should create a product', async () => {
    const dto = {
      productName: generateRandom('prod'),
      amountAvailable: 10,
      cost: 5,
    };

    const res = await request(app.getHttpServer())
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(dto)
      .expect(201);

    expect(res.body).toEqual({
      success: true,
      statusCode: 200,
      data: 'Product created successfully',
    });
  });

  it('should return paginated products', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/products?page=1&limit=10')
      .expect(200);

    expect((res.body as responseType).success).toBe(true);
    expect((res.body as responseType).data).toHaveProperty('data');
    expect(
      Array.isArray(
        ((res.body as responseType).data as paginateResponseType).data,
      ),
    ).toBe(true);
  });

  it('should return one product by ID', async () => {
    const product: Product = await prisma.product.create({
      data: {
        productName: generateRandom('prod'),
        amountAvailable: 10,
        cost: 5,
        sellerId,
      },
    });

    const res = await request(app.getHttpServer())
      .get(`/api/v1/products/${product.id}`)
      .expect(200);

    expect((res.body as responseType).success).toBe(true);
    expect(((res.body as responseType).data as Product).id).toBe(product.id);
  });

  it('should update a product', async () => {
    const updatedName = generateRandom('updated');

    const product: Product = await prisma.product.create({
      data: {
        productName: generateRandom('prod'),
        amountAvailable: 10,
        cost: 5,
        sellerId,
      },
    });

    const res = await request(app.getHttpServer())
      .patch(`/api/v1/products/${product.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        productName: updatedName,
        amountAvailable: 50,
        cost: 15,
      })
      .expect(200);

    expect(res.body).toEqual({
      success: true,
      statusCode: 200,
      data: 'Product updated successfully',
    });

    const updated = await prisma.product.findUnique({
      where: { id: product.id },
    });
    expect(updated?.productName).toBe(updatedName);
  });

  it('should delete a product', async () => {
    const product: Product = await prisma.product.create({
      data: {
        productName: generateRandom('prod'),
        amountAvailable: 10,
        cost: 5,
        sellerId,
      },
    });
    const res = await request(app.getHttpServer())
      .delete(`/api/v1/products/${product.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body).toEqual({
      success: true,
      statusCode: 200,
      data: 'Product deleted successfully',
    });

    const deleted = await prisma.product.findUnique({
      where: { id: product.id },
    });
    expect(deleted).toBeNull();
  });
});
