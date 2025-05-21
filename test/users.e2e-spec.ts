import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '@/app.module';
import { CreateUserDto } from '@/users/dto/create-user.dto';
import { EditUserDto } from '@/users/dto/edit-user.dto';

describe('UsersController (e2e)', () => {
  let app: INestApplication;
  let createdUserUuid: string = 'da416ecc-d8db-4622-a255-5fe94712201d';

  // Test user data
  const testUser: CreateUserDto = {
    email: `test-${Date.now()}@example.com`,
    password: 'Password123',
    firstName: 'Test',
    lastName: 'User',
    active: true,
  };

  // Updated user data
  const updatedUser: EditUserDto = {
    firstName: 'Updated',
    lastName: 'User',
    email: `updated-${Date.now()}@example.com`,
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Apply the same pipes as in the main.ts file
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
  });

  afterAll(async () => {
    await app.close();
  });

  it('should create a new user', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/users')
      .send(testUser)
      .expect(201);
    expect(response.body).toBeDefined();
    expect(response.body.statusCode).toBe(201);
    expect(response.body.message).toBe('User successfully created');
    expect(response.body.data).toBeDefined();
    expect(response.body.data.uuid).toBeDefined();
    // Save the UUID for later tests
    createdUserUuid = response.body.data.uuid;
    // Verify user data
    expect(response.body.data.email).toBe(testUser.email);
    expect(response.body.data.firstName).toBe(testUser.firstName);
    expect(response.body.data.lastName).toBe(testUser.lastName);
    expect(response.body.data.active).toBe(testUser.active);
    // Password should not be returned
    expect(response.body.data.password).toBeUndefined();
  });

  it('should find the user by UUID', async () => {
    const response = await request(app.getHttpServer())
      .get(`/api/users/${createdUserUuid}`)
      .expect(200);
    expect(response.body).toBeDefined();
    expect(response.body.statusCode).toBe(200);
    expect(response.body.message).toBe('User found');
    expect(response.body.data).toBeDefined();
    expect(response.body.data.uuid).toBe(createdUserUuid);
    // Verify user data
    expect(response.body.data.email).toBe(testUser.email);
    expect(response.body.data.firstName).toBe(testUser.firstName);
    expect(response.body.data.lastName).toBe(testUser.lastName);
  });

  it('should update the user', async () => {
    const response = await request(app.getHttpServer())
      .put(`/api/users/${createdUserUuid}`)
      .send(updatedUser)
      .expect(200);
    expect(response.body).toBeDefined();
    expect(response.body.statusCode).toBe(202);
    expect(response.body.message).toBe('User successfully updated');
  });

  it('should verify the user was updated', async () => {
    const response = await request(app.getHttpServer())
      .get(`/api/users/${createdUserUuid}`)
      .expect(200);
    expect(response.body).toBeDefined();
    expect(response.body.statusCode).toBe(200);
    expect(response.body.data).toBeDefined();
    // Verify updated user data
    expect(response.body.data.email).toBe(updatedUser.email);
    expect(response.body.data.firstName).toBe(updatedUser.firstName);
    expect(response.body.data.lastName).toBe(updatedUser.lastName);
  });

  it('should soft delete the user', async () => {
    const response = await request(app.getHttpServer())
      .delete(`/api/users/${createdUserUuid}`)
      .expect(200);
    expect(response.body).toBeDefined();
    expect(response.body.statusCode).toBe(202);
    expect(response.body.message).toBe('User successfully soft deleted');
  });

  it('should not find the soft-deleted user with regular find', () => {
    return request(app.getHttpServer())
      .get(`/api/users/${createdUserUuid}`)
      .expect(404);
  });

  it('should restore the soft-deleted user', async () => {
    const response = await request(app.getHttpServer())
      .put(`/api/users/${createdUserUuid}/restore`)
      .expect(200);
    expect(response.body).toBeDefined();
    expect(response.body.statusCode).toBe(200);
    expect(response.body.message).toBe('User successfully restored');
  });

  it('should find the restored user', async () => {
    const response = await request(app.getHttpServer())
      .get(`/api/users/${createdUserUuid}`)
      .expect(200);
    expect(response.body).toBeDefined();
    expect(response.body.statusCode).toBe(200);
    expect(response.body.message).toBe('User found');
    expect(response.body.data).toBeDefined();
    expect(response.body.data.uuid).toBe(createdUserUuid);
  });

  it('should permanently delete the user', async () => {
    const response = await request(app.getHttpServer())
      .delete(`/api/users/${createdUserUuid}/delete`)
      .expect(200);
    expect(response.body).toBeDefined();
    expect(response.body.statusCode).toBe(200);
    expect(response.body.message).toBe('User successfully deleted');
  });

  it('should not find the permanently deleted user', () => {
    return request(app.getHttpServer())
      .get(`/api/users/${createdUserUuid}`)
      .expect(404);
  });
});
