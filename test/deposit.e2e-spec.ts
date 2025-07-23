import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import {
  INestApplication,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { PrismaClient } from 'generated/prisma';
import { AppExceptionsFilter } from 'src/shared/filters/app-exception.filter';
import { ResponseInterceptor } from 'src/shared/interceptors/response.interceptor';
import { responseType, loginType } from 'src/shared/types/response.type';
import * as bcrypt from 'bcrypt';

const generateRandomUsername = () =>
  `buyer_${Math.random().toString(36).substring(2, 8)}`;

describe('DepositController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  let buyerToken: string;
  let buyerId: number;

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

    const username = generateRandomUsername();
    const plainPassword = 'secret123';
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        role: 'BUYER',
      },
    });

    const loginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ username, password: plainPassword });

    expect((loginRes.body as responseType).success).toBe(true);
    buyerToken = ((loginRes.body as responseType).data as loginType)
      .access_token;

    const user = await prisma.user.findUnique({ where: { username } });
    buyerId = user!.id;
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  it('should deposit coins', async () => {
    const cents = 100;

    const res = await request(app.getHttpServer())
      .post('/api/v1/deposit')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ cents })
      .expect(201);

    expect(res.body).toEqual({
      success: true,
      statusCode: 200,
      data: `Deposit ${cents} successful`,
    });

    const user = await prisma.user.findUnique({ where: { id: buyerId } });
    expect(user?.deposit).toBe(cents);
  });

  it('should reset deposit', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/deposit/reset')
      .set('Authorization', `Bearer ${buyerToken}`)
      .expect(201);

    expect(res.body).toEqual({
      success: true,
      statusCode: 200,
      data: `Your deposit reseted to 0 successful`,
    });

    const user = await prisma.user.findUnique({ where: { id: buyerId } });
    expect(user?.deposit).toBe(0);
  });
});
