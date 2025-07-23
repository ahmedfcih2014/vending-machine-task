// test/user.e2e-spec.ts
import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import {
  INestApplication,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { ConfigModule } from '@nestjs/config';
import { PrismaClient, User } from 'generated/prisma';
import {
  paginateResponseType,
  responseType,
} from 'src/shared/types/response.type';
import { AppExceptionsFilter } from 'src/shared/filters/app-exception.filter';
import { ResponseInterceptor } from 'src/shared/interceptors/response.interceptor';

const generateRandomUsername = (prefix = 'user'): string => {
  const randomPart = Math.random().toString(36).substring(2, 10); // 8 random chars
  return `${prefix}_${randomPart}`;
};

describe('UserController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaClient;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
        }),
        AppModule,
      ],
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
    app.enableVersioning({
      type: VersioningType.URI,
    });
    app.setGlobalPrefix('api');
    await app.init();

    prisma = new PrismaClient();
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  it('should create a user', async () => {
    const res = await request(app.getHttpServer()).post('/api/v1/users').send({
      username: generateRandomUsername(),
      password: 'secret123',
      role: 'BUYER',
    });

    expect(res.body as responseType).toEqual({
      success: true,
      statusCode: 200,
      data: 'user created successfully',
    });
  });

  it('should return paginated users', async () => {
    await prisma.user.createMany({
      data: [
        {
          username: generateRandomUsername(),
          password: 'pass1234',
          role: 'BUYER',
        },
        {
          username: generateRandomUsername(),
          password: 'pass1234',
          role: 'BUYER',
        },
      ],
    });

    const res = await request(app.getHttpServer())
      .get('/api/v1/users?page=1&limit=10')
      .expect(200);

    expect((res.body as responseType).success).toBe(true);
    expect((res.body as responseType).statusCode).toBe(200);
    expect((res.body as responseType).data).toHaveProperty('data');
    expect((res.body as responseType).data).toHaveProperty('meta');
    expect(
      Array.isArray(
        ((res.body as responseType).data as paginateResponseType).data,
      ),
    ).toBe(true);
  });

  it('should return one user by ID', async () => {
    const username = generateRandomUsername();
    await request(app.getHttpServer()).post('/api/v1/users').send({
      username,
      password: 'password123',
      role: 'BUYER',
    });

    const user: User | null = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const res = await request(app.getHttpServer())
      .get(`/api/v1/users/${user.id}`)
      .expect(200);

    expect((res.body as responseType).success).toBe(true);
    expect((res.body as responseType).data).toMatchObject({
      id: user.id,
      username,
      role: 'BUYER',
      deposit: 0,
    });
  });

  it('should update a user', async () => {
    const username = generateRandomUsername();
    await request(app.getHttpServer()).post('/api/v1/users').send({
      username,
      password: 'password123',
      role: 'BUYER',
    });

    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const res = await request(app.getHttpServer())
      .patch(`/api/v1/users/${user.id}`)
      .send({
        username: generateRandomUsername(),
        password: 'newpass123',
        role: 'BUYER',
      })
      .expect(200);

    expect(res.body).toEqual({
      success: true,
      statusCode: 200,
      data: 'user updated successfully',
    });
  });

  it('should delete a user', async () => {
    const username = generateRandomUsername();
    await request(app.getHttpServer()).post('/api/v1/users').send({
      username,
      password: 'password123',
      role: 'BUYER',
    });

    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const res = await request(app.getHttpServer())
      .delete(`/api/v1/users/${user.id}`)
      .expect(200);

    expect(res.body).toEqual({
      success: true,
      statusCode: 200,
      data: 'user deleted successfully',
    });
  });
});
