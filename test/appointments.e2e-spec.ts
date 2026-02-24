import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '@/app.module';
import { AppointmentStatus } from '@/appointment/enums/appointment-status.enum';
import { CancelledBy } from '@/appointment/enums/appointment-cancelled-by.enum';
import { RescheduledBy } from '@/appointment/enums/appointment-rescheduled-by.enum';

describe('AppointmentsController (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;

  const authRequest = (
    method: 'get' | 'post' | 'put' | 'patch' | 'delete',
    url: string,
  ) => {
    return request(app.getHttpServer())
      [method](url)
      .set('Authorization', `Bearer ${accessToken}`);
  };

  // Fill this
  const existingUserServiceUuid = '';
  const existingCalendarUuid = '';
  const existingOwnerUuid = '';
  const username = '';
  const password = '';

  let createdAppointmentUuid: string;
  let createdInternalAppointmentUuid: string;

  const scheduledAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // +7 dni
    .toISOString();
  const scheduledEndAt = new Date(
    Date.now() + 7 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000,
  ) // +7 dni +1h
    .toISOString();

  const rescheduledAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // +14 dni
    .toISOString();
  const rescheduledEndAt = new Date(
    Date.now() + 14 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000,
  ) // +14 dni +1h
    .toISOString();

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
      .send({ username, password })
      .expect(200);

    accessToken = loginResponse.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  // -----------------------------------------------------------------------
  // CREATE — rezerwacja klienta
  // -----------------------------------------------------------------------

  it('should create a new appointment (client booking)', async () => {
    const response = await authRequest('post', '/api/appointments')
      .send({
        userServiceId: existingUserServiceUuid,
        scheduledAt,
        clientEmail: 'klient@example.com',
        clientPhone: '500600700',
        note: 'Proszę o kontakt telefoniczny',
      })
      .expect(201);

    expect(response.body.statusCode).toBe(201);
    expect(response.body.message).toBe('Wizyta została utworzona');
    expect(response.body.data.uuid).toBeDefined();

    createdAppointmentUuid = response.body.data.uuid;
  });

  it('should return 409 when creating appointment in conflicting time slot', async () => {
    await authRequest('post', '/api/appointments')
      .send({
        userServiceId: existingUserServiceUuid,
        scheduledAt,
        clientEmail: 'inny@example.com',
      })
      .expect(409);
  });

  it('should return 400 when creating appointment without required fields', async () => {
    await authRequest('post', '/api/appointments').send({}).expect(400);
  });

  // -----------------------------------------------------------------------
  // CREATE INTERNAL
  // -----------------------------------------------------------------------

  it('should create a new internal appointment', async () => {
    const response = await authRequest('post', '/api/appointments/internal')
      .send({
        calendarId: existingCalendarUuid,
        ownerId: existingOwnerUuid,
        name: 'Spotkanie z dostawcą',
        scheduledAt: rescheduledAt,
        scheduledEndAt: rescheduledEndAt,
        note: 'Ważne spotkanie',
      })
      .expect(201);

    expect(response.body.statusCode).toBe(201);
    expect(response.body.message).toBe('Wizyta została utworzona');
    expect(response.body.data.uuid).toBeDefined();

    createdInternalAppointmentUuid = response.body.data.uuid;
  });

  it('should return 400 when creating internal appointment without calendarId', async () => {
    await authRequest('post', '/api/appointments/internal')
      .send({
        ownerId: existingOwnerUuid,
        name: 'Brakuje kalendarza',
        scheduledAt: rescheduledAt,
        scheduledEndAt: rescheduledEndAt,
      })
      .expect(400);
  });

  it('should return 400 when scheduledEndAt is before scheduledAt', async () => {
    await authRequest('post', '/api/appointments/internal')
      .send({
        calendarId: existingCalendarUuid,
        ownerId: existingOwnerUuid,
        name: 'Zła data',
        scheduledAt: rescheduledEndAt,
        scheduledEndAt: rescheduledAt,
      })
      .expect(400);
  });

  // -----------------------------------------------------------------------
  // FIND ALL
  // -----------------------------------------------------------------------

  it('should return paginated list of appointments', async () => {
    const response = await authRequest('get', '/api/appointments')
      .query({ page: 1, limit: 10 })
      .expect(200);

    expect(response.body.items).toBeDefined();
    expect(Array.isArray(response.body.items)).toBe(true);
    expect(response.body.pagination).toBeDefined();
    expect(response.body.pagination.currentPage).toBe(1);
    expect(response.body.pagination.itemsPerPage).toBe(10);
  });

  it('should return appointments filtered by query', async () => {
    const response = await authRequest('get', '/api/appointments')
      .query({ page: 1, limit: 10, query: 'klient@example.com' })
      .expect(200);

    expect(response.body.items).toBeDefined();
    expect(Array.isArray(response.body.items)).toBe(true);
  });

  // -----------------------------------------------------------------------
  // FIND BY CALENDAR
  // -----------------------------------------------------------------------

  it('should return appointments for a calendar', async () => {
    const response = await authRequest(
      'get',
      `/api/appointments/calendar/${existingCalendarUuid}`,
    )
      .query({ page: 1, limit: 10 })
      .expect(200);

    expect(response.body.items).toBeDefined();
    expect(Array.isArray(response.body.items)).toBe(true);
  });

  it('should return 400 when calendar UUID is invalid', async () => {
    await authRequest('get', '/api/appointments/calendar/not-a-uuid').expect(
      400,
    );
  });

  // -----------------------------------------------------------------------
  // FIND ONE
  // -----------------------------------------------------------------------

  it('should find appointment by UUID', async () => {
    const response = await authRequest(
      'get',
      `/api/appointments/${createdAppointmentUuid}`,
    ).expect(200);

    expect(response.body.statusCode).toBe(200);
    expect(response.body.data.uuid).toBe(createdAppointmentUuid);
    expect(response.body.data.status).toBe(AppointmentStatus.PENDING);
    expect(response.body.data.clientEmail).toBe('klient@example.com');
    expect(response.body.data.clientPhone).toBe('500600700');
    expect(response.body.data.note).toBe('Proszę o kontakt telefoniczny');
    expect(response.body.data.price).toBeDefined();
    expect(response.body.data.duration).toBeDefined();
  });

  it('should return 404 for non-existent appointment', async () => {
    await authRequest(
      'get',
      '/api/appointments/00000000-0000-0000-0000-000000000000',
    ).expect(404);
  });

  it('should return 400 when appointment UUID is invalid', async () => {
    await authRequest('get', '/api/appointments/not-a-uuid').expect(400);
  });

  // -----------------------------------------------------------------------
  // UPDATE
  // -----------------------------------------------------------------------

  it('should update appointment status to confirmed', async () => {
    const response = await authRequest(
      'put',
      `/api/appointments/${createdAppointmentUuid}`,
    )
      .send({ status: AppointmentStatus.CONFIRMED })
      .expect(200);

    expect(response.body.statusCode).toBe(202);
    expect(response.body.message).toBe('Wizyta została zaktualizowana');
  });

  it('should verify appointment status was updated to confirmed', async () => {
    const response = await authRequest(
      'get',
      `/api/appointments/${createdAppointmentUuid}`,
    ).expect(200);

    expect(response.body.data.status).toBe(AppointmentStatus.CONFIRMED);
  });

  it('should update appointment note', async () => {
    await authRequest('put', `/api/appointments/${createdAppointmentUuid}`)
      .send({ note: 'Zaktualizowana notatka' })
      .expect(200);
  });

  it('should return 404 when updating non-existent appointment', async () => {
    await authRequest(
      'put',
      '/api/appointments/00000000-0000-0000-0000-000000000000',
    )
      .send({ note: 'Notatka' })
      .expect(404);
  });

  // -----------------------------------------------------------------------
  // RESCHEDULE
  // -----------------------------------------------------------------------

  it('should reschedule the appointment', async () => {
    const newScheduledAt = new Date(
      Date.now() + 21 * 24 * 60 * 60 * 1000,
    ).toISOString();
    const newScheduledEndAt = new Date(
      Date.now() + 21 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000,
    ).toISOString();

    const response = await authRequest(
      'patch',
      `/api/appointments/${createdAppointmentUuid}/reschedule`,
    )
      .send({
        scheduledAt: newScheduledAt,
        scheduledEndAt: newScheduledEndAt,
        rescheduledBy: RescheduledBy.STAFF,
        note: 'Przełożone na prośbę salonu',
      })
      .expect(200);

    expect(response.body.statusCode).toBe(202);
    expect(response.body.message).toBe('Wizyta została przełożona');
  });

  it('should verify appointment was rescheduled', async () => {
    const response = await authRequest(
      'get',
      `/api/appointments/${createdAppointmentUuid}`,
    ).expect(200);

    expect(response.body.data.status).toBe(AppointmentStatus.RESCHEDULED);
    expect(response.body.data.rescheduledBy).toBe(RescheduledBy.STAFF);
    expect(response.body.data.previousScheduledAt).toBeDefined();
    expect(response.body.data.previousScheduledEndAt).toBeDefined();
    expect(response.body.data.rescheduledAt).toBeDefined();
  });

  it('should return 400 when rescheduling without required fields', async () => {
    await authRequest(
      'patch',
      `/api/appointments/${createdAppointmentUuid}/reschedule`,
    )
      .send({})
      .expect(400);
  });

  // -----------------------------------------------------------------------
  // CANCEL
  // -----------------------------------------------------------------------

  it('should cancel the appointment', async () => {
    const response = await authRequest(
      'patch',
      `/api/appointments/${createdAppointmentUuid}/cancel`,
    )
      .send({
        cancelledBy: CancelledBy.STAFF,
        cancellationReason: 'Pracownik niedostępny',
      })
      .expect(200);

    expect(response.body.statusCode).toBe(202);
    expect(response.body.message).toBe('Wizyta została anulowana');
  });

  it('should verify appointment was cancelled', async () => {
    const response = await authRequest(
      'get',
      `/api/appointments/${createdAppointmentUuid}`,
    ).expect(200);

    expect(response.body.data.status).toBe(AppointmentStatus.CANCELLED);
    expect(response.body.data.cancelledBy).toBe(CancelledBy.STAFF);
    expect(response.body.data.cancellationReason).toBe('Pracownik niedostępny');
    expect(response.body.data.cancelledAt).toBeDefined();
  });

  it('should return 409 when cancelling already cancelled appointment', async () => {
    await authRequest(
      'patch',
      `/api/appointments/${createdAppointmentUuid}/cancel`,
    )
      .send({ cancelledBy: CancelledBy.CLIENT })
      .expect(409);
  });

  it('should return 404 when cancelling non-existent appointment', async () => {
    await authRequest(
      'patch',
      '/api/appointments/00000000-0000-0000-0000-000000000000/cancel',
    )
      .send({ cancelledBy: CancelledBy.STAFF })
      .expect(404);
  });

  // -----------------------------------------------------------------------
  // CONFLICT RESOLUTION po anulowaniu
  // -----------------------------------------------------------------------

  it('should allow creating appointment in previously cancelled time slot', async () => {
    const response = await authRequest('post', '/api/appointments')
      .send({
        userServiceId: existingUserServiceUuid,
        scheduledAt,
        clientEmail: 'nowy@example.com',
      })
      .expect(201);

    expect(response.body.data.uuid).toBeDefined();

    // sprzątamy
    await authRequest(
      'delete',
      `/api/appointments/${response.body.data.uuid}`,
    ).expect(200);
  });

  // -----------------------------------------------------------------------
  // AUTHENTICATION
  // -----------------------------------------------------------------------

  it('should return 401 when accessing without token', async () => {
    await request(app.getHttpServer()).get('/api/appointments').expect(401);
  });

  // -----------------------------------------------------------------------
  // DELETE
  // -----------------------------------------------------------------------

  it('should delete the internal appointment', async () => {
    const response = await authRequest(
      'delete',
      `/api/appointments/${createdInternalAppointmentUuid}`,
    ).expect(200);

    expect(response.body.statusCode).toBe(200);
    expect(response.body.message).toBe('Wizyta została usunięta');
  });

  it('should not find deleted appointment', async () => {
    await authRequest(
      'get',
      `/api/appointments/${createdInternalAppointmentUuid}`,
    ).expect(404);
  });

  it('should return 404 when deleting non-existent appointment', async () => {
    await authRequest(
      'delete',
      '/api/appointments/00000000-0000-0000-0000-000000000000',
    ).expect(404);
  });
});
