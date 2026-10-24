import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AppointmentsService } from './appointments.service';
import { Appointment } from './entities/appointment.entity';
import { Calendar } from '@/calendar/entities/calendar.entity';
import { User } from '@/users/entities/user.entity';
import { Client } from '@/clients/entities/client.entity';
import { UsersServices } from '@/users-services/entities/users-services.entity';
import { MailService } from '@/mail/mail.service';
import { AppointmentStatus } from '@/appointment/enums/appointment-status.enum';
import { CancelledBy } from '@/appointment/enums/appointment-cancelled-by.enum';
import { RescheduledBy } from '@/appointment/enums/appointment-rescheduled-by.enum';
import { AppointmentNotFoundException } from '@/appointment/exceptions/appointment-not-found.exception';
import { AppointmentAlreadyCancelledException } from '@/appointment/exceptions/appointment-already-cancelled.exception';
import { AppointmentNotModifiableException } from '@/appointment/exceptions/appointment-not-modifiable.exception';
import { AppointmentInvalidDateRangeException } from '@/appointment/exceptions/appointment-invalid-date-range.exception';
import { AppointmentConflictException } from '@/appointment/exceptions/appointment-conflict.exception';
import { AppointmentInPastException } from '@/appointment/exceptions/appointment-in-past.exception';
import { AppointmentLeadTimeException } from '@/appointment/exceptions/appointment-lead-time.exception';
import { AppointmentClientEmailRequiredException } from '@/appointment/exceptions/appointment-client-email-required.exception';
import { AppointmentUnavailableException } from '@/appointment/exceptions/appointment-unavailable.exception';
import { AppointmentDurationMismatchException } from '@/appointment/exceptions/appointment-duration-mismatch.exception';
import { AppointmentRelationMismatchException } from '@/appointment/exceptions/appointment-relation-mismatch.exception';
import { CalendarNotFoundException } from '@/calendar/exceptions/calendar-not-found.exception';
import { ClientNotFoundException } from '@/clients/exceptions/client-not-found.exception';
import { UserServiceNotFoundException } from '@/users-services/exceptions/users-services-not-found.exception';

const NOW = new Date('2026-11-01T08:00:00.000Z');

const createUserService = (overrides: Record<string, unknown> = {}) => ({
  uuid: 'user-service-uuid',
  price: 120,
  duration: 60,
  active: true,
  user: {
    uuid: 'employee-uuid',
    firstName: 'Anna',
    lastName: 'Nowak',
    email: 'anna@hairdresser.pl',
    active: true,
    deleted: false,
  },
  service: {
    uuid: 'service-uuid',
    name: 'Strzyżenie',
    active: true,
    deleted: false,
  },
  ...overrides,
});

const createAppointment = (overrides: Partial<Appointment> = {}): Appointment =>
  ({
    uuid: 'appointment-uuid',
    name: 'Strzyżenie — Anna Nowak',
    status: AppointmentStatus.PENDING,
    price: 120,
    duration: 60,
    clientEmail: 'jan@example.com',
    scheduledAt: new Date('2026-11-02T10:00:00.000Z'),
    scheduledEndAt: new Date('2026-11-02T11:00:00.000Z'),
    deleted: false,
    calendar: {
      uuid: 'calendar-uuid',
      name: 'Kalendarz Anny',
      color: '#FF5733',
      owner: {
        uuid: 'employee-uuid',
        email: 'anna@hairdresser.pl',
        invitationToken: 'secret-invitation-token',
        role: {
          uuid: 'role-uuid',
          name: 'employee',
          permissions: [{ resource: 'calendar', actions: ['read'] }],
        },
      },
    },
    client: {
      uuid: 'client-uuid',
      firstName: 'Jan',
      lastName: 'Kowalski',
      email: 'jan@example.com',
      phone: '500600700',
      emailVerificationToken: 'secret-verification-token',
      marketingConsent: true,
    },
    userService: {
      uuid: 'user-service-uuid',
      price: 120,
      duration: 60,
      user: {
        uuid: 'employee-uuid',
        firstName: 'Anna',
        lastName: 'Nowak',
        email: 'anna@hairdresser.pl',
        invitationToken: 'secret-invitation-token',
        role: { uuid: 'role-uuid', name: 'employee', permissions: [] },
      },
      service: {
        uuid: 'service-uuid',
        name: 'Strzyżenie',
        description: 'Strzyżenie damskie',
        active: true,
      },
    },
    ...overrides,
  }) as unknown as Appointment;

describe('AppointmentsService', () => {
  let service: AppointmentsService;

  const conflictQueryBuilder = {
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getOne: jest.fn(),
  };

  const appointmentRepository = {
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    createQueryBuilder: jest.fn(() => conflictQueryBuilder),
  };

  const calendarRepository = { findOne: jest.fn(), findOneBy: jest.fn() };
  const userRepository = { findOneBy: jest.fn() };
  const clientRepository = { findOneBy: jest.fn() };
  const usersServicesRepository = { findOne: jest.fn() };

  const mailService = {
    sendAppointmentCreatedToClient: jest.fn().mockResolvedValue(undefined),
    sendAppointmentCreatedToEmployee: jest.fn().mockResolvedValue(undefined),
    sendAppointmentConfirmedToClient: jest.fn().mockResolvedValue(undefined),
    sendAppointmentCancelledToClient: jest.fn().mockResolvedValue(undefined),
    sendAppointmentCancelledToEmployee: jest.fn().mockResolvedValue(undefined),
    sendAppointmentRescheduledToClient: jest.fn().mockResolvedValue(undefined),
    sendAppointmentRescheduledToEmployee: jest
      .fn()
      .mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    jest.spyOn(Date, 'now').mockReturnValue(NOW.getTime());
    conflictQueryBuilder.getOne.mockResolvedValue(null);
    appointmentRepository.save.mockImplementation(async entity => entity);
    appointmentRepository.create.mockImplementation(data => ({
      uuid: 'new-appointment-uuid',
      ...data,
    }));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppointmentsService,
        {
          provide: getRepositoryToken(Appointment),
          useValue: appointmentRepository,
        },
        { provide: getRepositoryToken(Calendar), useValue: calendarRepository },
        { provide: getRepositoryToken(User), useValue: userRepository },
        { provide: getRepositoryToken(Client), useValue: clientRepository },
        {
          provide: getRepositoryToken(UsersServices),
          useValue: usersServicesRepository,
        },
        { provide: MailService, useValue: mailService },
      ],
    }).compile();

    service = module.get<AppointmentsService>(AppointmentsService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('create', () => {
    const dto = {
      userServiceId: 'user-service-uuid',
      scheduledAt: '2026-11-02T10:00:00.000Z',
      clientEmail: 'jan@example.com',
    };

    beforeEach(() => {
      usersServicesRepository.findOne.mockResolvedValue(createUserService());
      calendarRepository.findOneBy.mockResolvedValue({
        uuid: 'calendar-uuid',
      });
    });

    it('creates pending appointment ending after service duration', async () => {
      await service.create(dto);

      expect(appointmentRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: AppointmentStatus.PENDING,
          clientEmail: 'jan@example.com',
          scheduledAt: new Date('2026-11-02T10:00:00.000Z'),
          scheduledEndAt: new Date('2026-11-02T11:00:00.000Z'),
          duration: 60,
        }),
      );
      expect(mailService.sendAppointmentCreatedToClient).toHaveBeenCalledWith(
        'jan@example.com',
        expect.any(Object),
      );
      expect(mailService.sendAppointmentCreatedToEmployee).toHaveBeenCalled();
    });

    it('looks only for active, not deleted default calendar', async () => {
      calendarRepository.findOneBy.mockResolvedValue(null);

      await expect(service.create(dto)).rejects.toBeInstanceOf(
        CalendarNotFoundException,
      );
      expect(calendarRepository.findOneBy).toHaveBeenCalledWith(
        expect.objectContaining({
          isDefault: true,
          active: true,
          deleted: false,
        }),
      );
    });

    it('rejects date in the past', async () => {
      await expect(
        service.create({ ...dto, scheduledAt: '2026-11-01T07:00:00.000Z' }),
      ).rejects.toBeInstanceOf(AppointmentInPastException);
      expect(appointmentRepository.save).not.toHaveBeenCalled();
    });

    it('rejects client booking starting in less than an hour', async () => {
      const in30Minutes = new Date(NOW.getTime() + 30 * 60 * 1000);

      await expect(
        service.create(
          { ...dto, scheduledAt: in30Minutes.toISOString() },
          { bookedByClient: true },
        ),
      ).rejects.toBeInstanceOf(AppointmentLeadTimeException);
    });

    it('accepts client booking starting exactly in an hour', async () => {
      const inOneHour = new Date(NOW.getTime() + 60 * 60 * 1000);

      await service.create(
        { ...dto, scheduledAt: inOneHour.toISOString() },
        { bookedByClient: true },
      );

      expect(appointmentRepository.save).toHaveBeenCalled();
    });

    it('allows staff to book a slot starting in less than an hour', async () => {
      const in30Minutes = new Date(NOW.getTime() + 30 * 60 * 1000);

      await service.create({ ...dto, scheduledAt: in30Minutes.toISOString() });

      expect(appointmentRepository.save).toHaveBeenCalled();
    });

    it('requires client email when booking is not linked to client account', async () => {
      await expect(
        service.create({ ...dto, clientEmail: undefined }),
      ).rejects.toBeInstanceOf(AppointmentClientEmailRequiredException);
      expect(appointmentRepository.save).not.toHaveBeenCalled();
    });

    it('uses email from client account', async () => {
      clientRepository.findOneBy.mockResolvedValue({
        uuid: 'client-uuid',
        firstName: 'Jan',
        lastName: 'Kowalski',
        email: 'konto@example.com',
        phone: '500600700',
      });

      await service.create(
        { ...dto, clientEmail: undefined },
        { clientUuid: 'client-uuid' },
      );

      expect(appointmentRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          clientEmail: 'konto@example.com',
          clientPhone: '500600700',
        }),
      );
    });

    it('rejects unknown client account', async () => {
      clientRepository.findOneBy.mockResolvedValue(null);

      await expect(
        service.create(dto, { clientUuid: 'missing-client' }),
      ).rejects.toBeInstanceOf(ClientNotFoundException);
    });

    it.each([
      ['inactive assignment', { active: false }],
      [
        'inactive service',
        { service: { name: 'Strzyżenie', active: false, deleted: false } },
      ],
      [
        'deleted service',
        { service: { name: 'Strzyżenie', active: true, deleted: true } },
      ],
      [
        'inactive employee',
        { user: { uuid: 'employee-uuid', active: false, deleted: false } },
      ],
      [
        'deleted employee',
        { user: { uuid: 'employee-uuid', active: true, deleted: true } },
      ],
    ])('rejects booking for %s', async (_, overrides) => {
      usersServicesRepository.findOne.mockResolvedValue(
        createUserService(overrides),
      );

      await expect(service.create(dto)).rejects.toBeInstanceOf(
        AppointmentUnavailableException,
      );
      expect(appointmentRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('createInternal', () => {
    const dto = {
      calendarId: 'calendar-uuid',
      ownerId: 'employee-uuid',
      name: 'Spotkanie z dostawcą',
      scheduledAt: '2026-11-02T10:00:00.000Z',
      scheduledEndAt: '2026-11-02T10:45:00.000Z',
    };

    beforeEach(() => {
      userRepository.findOneBy.mockResolvedValue({ uuid: 'employee-uuid' });
      calendarRepository.findOne.mockResolvedValue({
        uuid: 'calendar-uuid',
        owner: { uuid: 'employee-uuid' },
      });
    });

    it('creates confirmed event with duration taken from dates', async () => {
      await service.createInternal(dto);

      expect(appointmentRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: AppointmentStatus.CONFIRMED,
          duration: 45,
          price: null,
        }),
      );
    });

    it('rejects duration not matching dates', async () => {
      await expect(
        service.createInternal({ ...dto, duration: 60 }),
      ).rejects.toBeInstanceOf(AppointmentDurationMismatchException);
    });

    it('rejects date in the past', async () => {
      await expect(
        service.createInternal({
          ...dto,
          scheduledAt: '2026-11-01T07:00:00.000Z',
        }),
      ).rejects.toBeInstanceOf(AppointmentInPastException);
    });

    it('looks only for active, not deleted calendar', async () => {
      calendarRepository.findOne.mockResolvedValue(null);

      await expect(service.createInternal(dto)).rejects.toBeInstanceOf(
        CalendarNotFoundException,
      );
      expect(calendarRepository.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { uuid: 'calendar-uuid', active: true, deleted: false },
        }),
      );
    });

    it('rejects calendar of another employee', async () => {
      calendarRepository.findOne.mockResolvedValue({
        uuid: 'calendar-uuid',
        owner: { uuid: 'other-employee-uuid' },
      });

      await expect(service.createInternal(dto)).rejects.toBeInstanceOf(
        AppointmentRelationMismatchException,
      );
    });

    it('rejects unknown client', async () => {
      clientRepository.findOneBy.mockResolvedValue(null);

      await expect(
        service.createInternal({ ...dto, clientId: 'missing-client' }),
      ).rejects.toBeInstanceOf(ClientNotFoundException);
    });

    it('rejects unknown service assignment', async () => {
      usersServicesRepository.findOne.mockResolvedValue(null);

      await expect(
        service.createInternal({ ...dto, userServiceId: 'missing' }),
      ).rejects.toBeInstanceOf(UserServiceNotFoundException);
    });

    it('rejects service assigned to another employee', async () => {
      usersServicesRepository.findOne.mockResolvedValue(
        createUserService({ user: { uuid: 'other-employee-uuid' } }),
      );

      await expect(
        service.createInternal({ ...dto, userServiceId: 'user-service-uuid' }),
      ).rejects.toBeInstanceOf(AppointmentRelationMismatchException);
    });

    it('takes price from employee service assignment', async () => {
      usersServicesRepository.findOne.mockResolvedValue(createUserService());

      await service.createInternal({
        ...dto,
        userServiceId: 'user-service-uuid',
      });

      expect(appointmentRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ price: 120 }),
      );
    });
  });

  describe('response shape', () => {
    it('find returns appointment without roles, permissions and tokens', async () => {
      appointmentRepository.findOne.mockResolvedValue(createAppointment());

      const { data } = await service.find('appointment-uuid');
      const serialized = JSON.stringify(data);

      expect(data.calendar).toEqual({
        uuid: 'calendar-uuid',
        name: 'Kalendarz Anny',
        color: '#FF5733',
      });
      expect(data.userService.user).toEqual({
        uuid: 'employee-uuid',
        firstName: 'Anna',
        lastName: 'Nowak',
        email: 'anna@hairdresser.pl',
      });
      expect(data.client).toEqual({
        uuid: 'client-uuid',
        firstName: 'Jan',
        lastName: 'Kowalski',
        email: 'jan@example.com',
        phone: '500600700',
      });
      expect(serialized).not.toContain('permissions');
      expect(serialized).not.toContain('secret-invitation-token');
      expect(serialized).not.toContain('secret-verification-token');
    });

    it('find returns null for missing relations', async () => {
      appointmentRepository.findOne.mockResolvedValue(
        createAppointment({ client: null, userService: null }),
      );

      const { data } = await service.find('appointment-uuid');

      expect(data.client).toBeNull();
      expect(data.userService).toBeNull();
      expect(data.createdBy).toBeNull();
    });

    it('findByCalendar maps every appointment to response shape', async () => {
      appointmentRepository.findAndCount.mockResolvedValue([
        [createAppointment()],
        1,
      ]);

      const result = await service.findByCalendar('calendar-uuid', {
        page: 1,
        limit: 10,
      });

      expect(result.items).toHaveLength(1);
      expect(JSON.stringify(result.items)).not.toContain('invitationToken');
      expect(result.pagination.total).toBe(1);
    });
  });

  describe('deleted appointments', () => {
    beforeEach(() => {
      appointmentRepository.findOne.mockResolvedValue(null);
    });

    it.each([
      ['find', () => service.find('appointment-uuid')],
      ['update', () => service.update('appointment-uuid', { note: 'x' })],
      [
        'cancel',
        () =>
          service.cancel('appointment-uuid', {
            cancelledBy: CancelledBy.STAFF,
          }),
      ],
      [
        'reschedule',
        () =>
          service.reschedule('appointment-uuid', {
            scheduledAt: '2026-11-03T10:00:00.000Z',
            scheduledEndAt: '2026-11-03T11:00:00.000Z',
            rescheduledBy: RescheduledBy.STAFF,
          }),
      ],
      ['remove', () => service.remove('appointment-uuid')],
    ])('%s ignores deleted appointments', async (_, action) => {
      await expect(action()).rejects.toBeInstanceOf(
        AppointmentNotFoundException,
      );
      expect(appointmentRepository.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { uuid: 'appointment-uuid', deleted: false },
        }),
      );
      expect(appointmentRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('rejects any change of cancelled appointment', async () => {
      appointmentRepository.findOne.mockResolvedValue(
        createAppointment({ status: AppointmentStatus.CANCELLED }),
      );

      await expect(
        service.update('appointment-uuid', { note: 'Nowa notatka' }),
      ).rejects.toBeInstanceOf(AppointmentNotModifiableException);
      expect(appointmentRepository.save).not.toHaveBeenCalled();
    });

    it('rejects date change of completed appointment', async () => {
      appointmentRepository.findOne.mockResolvedValue(
        createAppointment({ status: AppointmentStatus.COMPLETED }),
      );

      await expect(
        service.update('appointment-uuid', {
          scheduledAt: '2026-11-03T10:00:00.000Z',
        }),
      ).rejects.toBeInstanceOf(AppointmentNotModifiableException);
    });

    it('allows note change of completed appointment', async () => {
      appointmentRepository.findOne.mockResolvedValue(
        createAppointment({ status: AppointmentStatus.COMPLETED }),
      );

      await service.update('appointment-uuid', { note: 'Klient zadowolony' });

      expect(appointmentRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ note: 'Klient zadowolony' }),
      );
    });

    it('rejects end date before existing start date', async () => {
      appointmentRepository.findOne.mockResolvedValue(createAppointment());

      await expect(
        service.update('appointment-uuid', {
          scheduledEndAt: '2026-11-02T09:00:00.000Z',
        }),
      ).rejects.toBeInstanceOf(AppointmentInvalidDateRangeException);
      expect(appointmentRepository.save).not.toHaveBeenCalled();
    });

    it('rejects start date after existing end date', async () => {
      appointmentRepository.findOne.mockResolvedValue(createAppointment());

      await expect(
        service.update('appointment-uuid', {
          scheduledAt: '2026-11-02T12:00:00.000Z',
        }),
      ).rejects.toBeInstanceOf(AppointmentInvalidDateRangeException);
    });

    it('checks conflicts and saves valid new dates', async () => {
      appointmentRepository.findOne.mockResolvedValue(createAppointment());

      await service.update('appointment-uuid', {
        scheduledAt: '2026-11-02T10:30:00.000Z',
      });

      expect(conflictQueryBuilder.getOne).toHaveBeenCalled();
      expect(appointmentRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          scheduledAt: new Date('2026-11-02T10:30:00.000Z'),
          scheduledEndAt: new Date('2026-11-02T11:00:00.000Z'),
        }),
      );
    });

    it('rejects new dates colliding with other appointment', async () => {
      appointmentRepository.findOne.mockResolvedValue(createAppointment());
      conflictQueryBuilder.getOne.mockResolvedValue(
        createAppointment({ uuid: 'other-uuid' }),
      );

      await expect(
        service.update('appointment-uuid', {
          scheduledAt: '2026-11-02T10:30:00.000Z',
        }),
      ).rejects.toBeInstanceOf(AppointmentConflictException);
    });

    it('shifts end date when only duration changes', async () => {
      appointmentRepository.findOne.mockResolvedValue(createAppointment());

      await service.update('appointment-uuid', { duration: 90 });

      expect(appointmentRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          scheduledEndAt: new Date('2026-11-02T11:30:00.000Z'),
          duration: 90,
        }),
      );
    });

    it('recalculates duration when dates change', async () => {
      appointmentRepository.findOne.mockResolvedValue(createAppointment());

      await service.update('appointment-uuid', {
        scheduledEndAt: '2026-11-02T10:45:00.000Z',
      });

      expect(appointmentRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ duration: 45 }),
      );
    });

    it('rejects duration not matching new dates', async () => {
      appointmentRepository.findOne.mockResolvedValue(createAppointment());

      await expect(
        service.update('appointment-uuid', {
          scheduledEndAt: '2026-11-02T10:45:00.000Z',
          duration: 60,
        }),
      ).rejects.toBeInstanceOf(AppointmentDurationMismatchException);
    });

    it('rejects moving start date to the past', async () => {
      appointmentRepository.findOne.mockResolvedValue(createAppointment());

      await expect(
        service.update('appointment-uuid', {
          scheduledAt: '2026-11-01T07:00:00.000Z',
        }),
      ).rejects.toBeInstanceOf(AppointmentInPastException);
    });

    it('allows extending appointment that has already started', async () => {
      appointmentRepository.findOne.mockResolvedValue(
        createAppointment({
          scheduledAt: new Date('2026-11-01T07:30:00.000Z'),
          scheduledEndAt: new Date('2026-11-01T08:30:00.000Z'),
        }),
      );

      await service.update('appointment-uuid', {
        scheduledEndAt: '2026-11-01T09:00:00.000Z',
      });

      expect(appointmentRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ duration: 90 }),
      );
    });

    it('sends confirmation mail when status changes to confirmed', async () => {
      const appointment = createAppointment();
      appointmentRepository.findOne
        .mockResolvedValueOnce(appointment)
        .mockResolvedValueOnce(appointment);

      await service.update('appointment-uuid', {
        status: AppointmentStatus.CONFIRMED,
      });

      expect(mailService.sendAppointmentConfirmedToClient).toHaveBeenCalledWith(
        'jan@example.com',
        expect.objectContaining({ serviceName: 'Strzyżenie' }),
      );
    });

    it('does not resend confirmation mail for already confirmed appointment', async () => {
      appointmentRepository.findOne.mockResolvedValue(
        createAppointment({ status: AppointmentStatus.CONFIRMED }),
      );

      await service.update('appointment-uuid', {
        status: AppointmentStatus.CONFIRMED,
      });

      expect(
        mailService.sendAppointmentConfirmedToClient,
      ).not.toHaveBeenCalled();
    });
  });

  describe('cancel', () => {
    it('rejects already cancelled appointment', async () => {
      appointmentRepository.findOne.mockResolvedValue(
        createAppointment({ status: AppointmentStatus.CANCELLED }),
      );

      await expect(
        service.cancel('appointment-uuid', { cancelledBy: CancelledBy.STAFF }),
      ).rejects.toBeInstanceOf(AppointmentAlreadyCancelledException);
    });

    it('rejects completed appointment', async () => {
      appointmentRepository.findOne.mockResolvedValue(
        createAppointment({ status: AppointmentStatus.COMPLETED }),
      );

      await expect(
        service.cancel('appointment-uuid', { cancelledBy: CancelledBy.STAFF }),
      ).rejects.toBeInstanceOf(AppointmentNotModifiableException);
      expect(
        mailService.sendAppointmentCancelledToClient,
      ).not.toHaveBeenCalled();
    });

    it('cancels appointment and notifies client and employee', async () => {
      appointmentRepository.findOne.mockResolvedValue(createAppointment());

      await service.cancel('appointment-uuid', {
        cancelledBy: CancelledBy.CLIENT,
        cancellationReason: 'Zmiana planów',
      });

      expect(appointmentRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: AppointmentStatus.CANCELLED,
          cancelledBy: CancelledBy.CLIENT,
          cancellationReason: 'Zmiana planów',
        }),
      );
      expect(mailService.sendAppointmentCancelledToClient).toHaveBeenCalled();
      expect(mailService.sendAppointmentCancelledToEmployee).toHaveBeenCalled();
    });
  });

  describe('reschedule', () => {
    const dto = {
      scheduledAt: '2026-11-03T10:00:00.000Z',
      scheduledEndAt: '2026-11-03T11:00:00.000Z',
      rescheduledBy: RescheduledBy.STAFF,
    };

    it.each([AppointmentStatus.CANCELLED, AppointmentStatus.COMPLETED])(
      'rejects %s appointment',
      async status => {
        appointmentRepository.findOne.mockResolvedValue(
          createAppointment({ status }),
        );

        await expect(
          service.reschedule('appointment-uuid', dto),
        ).rejects.toBeInstanceOf(AppointmentNotModifiableException);
        expect(appointmentRepository.save).not.toHaveBeenCalled();
      },
    );

    it('rejects new date in the past', async () => {
      appointmentRepository.findOne.mockResolvedValue(createAppointment());

      await expect(
        service.reschedule('appointment-uuid', {
          ...dto,
          scheduledAt: '2026-11-01T07:00:00.000Z',
          scheduledEndAt: '2026-11-01T07:30:00.000Z',
        }),
      ).rejects.toBeInstanceOf(AppointmentInPastException);
    });

    it('recalculates duration from new dates', async () => {
      appointmentRepository.findOne.mockResolvedValue(createAppointment());

      await service.reschedule('appointment-uuid', {
        ...dto,
        scheduledEndAt: '2026-11-03T10:30:00.000Z',
      });

      expect(appointmentRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ duration: 30 }),
      );
    });

    it('stores previous dates and marks appointment as rescheduled', async () => {
      appointmentRepository.findOne.mockResolvedValue(createAppointment());

      await service.reschedule('appointment-uuid', dto);

      expect(appointmentRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: AppointmentStatus.RESCHEDULED,
          scheduledAt: new Date(dto.scheduledAt),
          previousScheduledAt: new Date('2026-11-02T10:00:00.000Z'),
        }),
      );
    });
  });

  describe('remove', () => {
    it('marks appointment as deleted', async () => {
      appointmentRepository.findOne.mockResolvedValue(createAppointment());

      await service.remove('appointment-uuid');

      expect(appointmentRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ deleted: true }),
      );
    });
  });
});
