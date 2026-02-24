import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '@/app.module';
import { CreateUsersServicesDto } from '@/users-services/dto/create-users-services.dto';
import { UpdateUsersServicesDto } from '@/users-services/dto/update-users-services.dto';

describe('UsersServicesController (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;

  const authRequest = (
    method: 'get' | 'post' | 'put' | 'delete',
    url: string,
  ) => {
    return request(app.getHttpServer())
      [method](url)
      .set('Authorization', `Bearer ${accessToken}`);
  };

  // Fill this
  const existingUserUuid = '';
  const existingServiceUuid = '';
  const username = '';
  const password = '';

  let createdUsersServiceUuid: string;

  const testUsersService: CreateUsersServicesDto = {
    userUuid: existingUserUuid,
    serviceUuid: existingServiceUuid,
    price: 80.0,
    duration: 45,
    active: true,
  };

  const updatedUsersService: UpdateUsersServicesDto = {
    price: 100.0,
    duration: 60,
    active: true,
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );

    app.setGlobalPrefix('api');
    await app.init();

    const loginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        username,
        password,
      });

    accessToken = loginResponse.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  // ─── CREATE ───────────────────────────────────────────────────────────────

  it('should create a new user service assignment', async () => {
    const response = await authRequest('post', '/api/users-services')
      .send(testUsersService)
      .expect(201);

    expect(response.body).toBeDefined();
    expect(response.body.statusCode).toBe(201);
    expect(response.body.message).toBe('User service successfully created');
    expect(response.body.data).toBeDefined();
    expect(response.body.data.uuid).toBeDefined();
    expect(response.body.data.price).toBe(testUsersService.price);
    expect(response.body.data.duration).toBe(testUsersService.duration);
    expect(response.body.data.active).toBe(testUsersService.active);

    createdUsersServiceUuid = response.body.data.uuid;
  });

  it('should not create duplicate user service assignment', async () => {
    const response = await authRequest('post', '/api/users-services')
      .send(testUsersService)
      .expect(409);

    expect(response.body.statusCode).toBe(409);
  });

  it('should not create assignment with non-existing user', async () => {
    const response = await authRequest('post', '/api/users-services')
      .send({
        ...testUsersService,
        userUuid: '00000000-0000-0000-0000-000000000000',
      })
      .expect(404);

    expect(response.body.statusCode).toBe(404);
  });

  it('should not create assignment with non-existing service', async () => {
    const response = await authRequest('post', '/api/users-services')
      .send({
        ...testUsersService,
        serviceUuid: '00000000-0000-0000-0000-000000000000',
      })
      .expect(404);

    expect(response.body.statusCode).toBe(404);
  });

  // ─── READ ─────────────────────────────────────────────────────────────────

  it('should find all user service assignments', async () => {
    const response = await authRequest('get', '/api/users-services').expect(
      200,
    );

    expect(response.body).toBeDefined();
    expect(response.body.items).toBeDefined();
    expect(response.body.pagination).toBeDefined();
  });

  it('should find user service assignment by UUID', async () => {
    const response = await authRequest(
      'get',
      `/api/users-services/${createdUsersServiceUuid}`,
    ).expect(200);

    expect(response.body).toBeDefined();
    expect(response.body.statusCode).toBe(200);
    expect(response.body.message).toBe('User service found');
    expect(response.body.data.uuid).toBe(createdUsersServiceUuid);
    expect(response.body.data.price).toBe(testUsersService.price);
    expect(response.body.data.duration).toBe(testUsersService.duration);
  });

  it('should not find user service assignment with invalid UUID', async () => {
    return authRequest(
      'get',
      '/api/users-services/00000000-0000-0000-0000-000000000000',
    ).expect(404);
  });

  it('should find all assignments by user UUID', async () => {
    const response = await authRequest(
      'get',
      `/api/users-services/user/${existingUserUuid}`,
    ).expect(200);

    expect(response.body).toBeDefined();
    expect(response.body.items).toBeDefined();
    expect(response.body.items.length).toBeGreaterThan(0);
    expect(response.body.pagination).toBeDefined();
  });

  it('should find all assignments by service UUID', async () => {
    const response = await authRequest(
      'get',
      `/api/users-services/service/${existingServiceUuid}`,
    ).expect(200);

    expect(response.body).toBeDefined();
    expect(response.body.items).toBeDefined();
    expect(response.body.items.length).toBeGreaterThan(0);
    expect(response.body.pagination).toBeDefined();
  });

  // ─── UPDATE ───────────────────────────────────────────────────────────────

  it('should update the user service assignment', async () => {
    const response = await authRequest(
      'put',
      `/api/users-services/${createdUsersServiceUuid}`,
    )
      .send(updatedUsersService)
      .expect(200);

    expect(response.body).toBeDefined();
    expect(response.body.statusCode).toBe(202);
    expect(response.body.message).toBe('User service successfully updated');
  });

  it('should verify the user service was updated', async () => {
    const response = await authRequest(
      'get',
      `/api/users-services/${createdUsersServiceUuid}`,
    ).expect(200);

    expect(response.body.data.price).toBe(updatedUsersService.price);
    expect(response.body.data.duration).toBe(updatedUsersService.duration);
  });

  it('should not update non-existing user service assignment', async () => {
    return authRequest(
      'put',
      '/api/users-services/00000000-0000-0000-0000-000000000000',
    )
      .send(updatedUsersService)
      .expect(404);
  });

  // ─── DELETE ───────────────────────────────────────────────────────────────

  it('should permanently delete the user service assignment', async () => {
    const response = await authRequest(
      'delete',
      `/api/users-services/${createdUsersServiceUuid}`,
    ).expect(200);

    expect(response.body).toBeDefined();
    expect(response.body.statusCode).toBe(200);
    expect(response.body.message).toBe('User service successfully deleted');
  });

  it('should not find the deleted user service assignment', () => {
    return authRequest(
      'get',
      `/api/users-services/${createdUsersServiceUuid}`,
    ).expect(404);
  });
});
