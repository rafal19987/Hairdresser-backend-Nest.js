import { ForbiddenException } from '@nestjs/common';
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
import { AppointmentType } from '@/appointment/enums/appointment-type.enum';
import { DataSource } from 'typeorm';
import { SALON_SERVICE } from '@/salon/interfaces/salon-service.interface';
import { BookingAccessService } from '@/booking-access/booking-access.service';
import { ConfigService } from '@nestjs/config';
import { AuditLogService } from '@/audit-log/audit-log.service';
import { CalendarAccessService } from '@/calendar/calendar-access.service';
import { AppointmentOutsideOpeningHoursException } from '@/appointment/exceptions/appointment-outside-opening-hours.exception';
import { AppointmentBeyondBookingHorizonException } from '@/appointment/exceptions/appointment-beyond-booking-horizon.exception';

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
    type: AppointmentType.CLIENT,
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
    innerJoin: jest.fn().mockReturnThis(),
    innerJoinAndSelect: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getOne: jest.fn(),
    getMany: jest.fn(),
  };

  const lockQueryBuilder = {
    setLock: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
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
  const calendarAccessService = { assertCanRead: jest.fn() };
  const userRepository = { findOneBy: jest.fn() };
  const clientRepository = { findOneBy: jest.fn() };
  const usersServicesRepository = { findOne: jest.fn() };

  const transactionManager = {
    getRepository: jest.fn(entity =>
      entity === User
        ? { createQueryBuilder: () => lockQueryBuilder }
        : appointmentRepository,
    ),
  };

  const dataSource = {
    transaction: jest.fn(async callback => callback(transactionManager)),
  };

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

  const salon = {
    uuid: 'salon-uuid',
    timeZone: 'Europe/Warsaw',
    clientMinLeadTimeMinutes: 60,
    maxBookingDaysAhead: 60,
  };

  const salonService = {
    getBookingSettings: jest.fn(),
    findOpeningRanges: jest.fn(),
  };

  const bookingAccessService = { createManageUrl: jest.fn() };

  const auditLogService = { record: jest.fn() };

  const auditActions = () =>
    auditLogService.record.mock.calls.map(([entry]) => entry.action);

  const flushMails = () => new Promise(resolve => setImmediate(resolve));

  beforeEach(async () => {
    jest.clearAllMocks();
    jest.spyOn(Date, 'now').mockReturnValue(NOW.getTime());
    salonService.getBookingSettings.mockResolvedValue(salon);
    bookingAccessService.createManageUrl.mockResolvedValue(
      'https://reve.pl/moje-wizyty/token',
    );
    salonService.findOpeningRanges.mockResolvedValue([
      { opensAt: '00:00', closesAt: '23:59' },
    ]);
    conflictQueryBuilder.getOne.mockResolvedValue(null);
    conflictQueryBuilder.getMany.mockResolvedValue([]);
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
        { provide: DataSource, useValue: dataSource },
        { provide: SALON_SERVICE, useValue: salonService },
        { provide: BookingAccessService, useValue: bookingAccessService },
        { provide: AuditLogService, useValue: auditLogService },
        { provide: CalendarAccessService, useValue: calendarAccessService },
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) =>
              key === 'CLIENT_ACCOUNT_URL'
                ? 'https://reve.pl/konto'
                : undefined,
          },
        },
      ],
    }).compile();

    service = module.get<AppointmentsService>(AppointmentsService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('findInRange', () => {
    const query = {
      from: '2026-11-02T00:00:00.000Z',
      to: '2026-11-09T00:00:00.000Z',
      calendarIds: ['calendar-a', 'calendar-b', 'calendar-a'],
    };

    it('returns appointments overlapping the range from visible calendars', async () => {
      conflictQueryBuilder.getMany.mockResolvedValue([createAppointment()]);

      const result = await service.findInRange(query, 'user-uuid');

      expect(calendarAccessService.assertCanRead).toHaveBeenCalledWith(
        'user-uuid',
        ['calendar-a', 'calendar-b'],
      );
      expect(conflictQueryBuilder.where).toHaveBeenCalledWith(
        'calendar.uuid IN (:...calendarUuids)',
        { calendarUuids: ['calendar-a', 'calendar-b'] },
      );
      expect(conflictQueryBuilder.andWhere).toHaveBeenCalledWith(
        'appointment.scheduledAt < :to',
        { to: new Date(query.to) },
      );
      expect(conflictQueryBuilder.andWhere).toHaveBeenCalledWith(
        'appointment.scheduledEndAt > :from',
        { from: new Date(query.from) },
      );
      expect(result.data).toHaveLength(1);
    });

    it('does not query calendars the user cannot see', async () => {
      calendarAccessService.assertCanRead.mockRejectedValueOnce(
        new ForbiddenException(),
      );

      await expect(
        service.findInRange(query, 'user-uuid'),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(conflictQueryBuilder.getMany).not.toHaveBeenCalled();
    });

    it.each([
      [
        'ends before it starts',
        '2026-11-09T00:00:00.000Z',
        '2026-11-02T00:00:00.000Z',
      ],
      [
        'is longer than 45 days',
        '2026-11-01T00:00:00.000Z',
        '2026-12-17T00:00:00.000Z',
      ],
    ])('rejects a range that %s', async (_, from, to) => {
      await expect(
        service.findInRange({ ...query, from, to }, 'user-uuid'),
      ).rejects.toBeInstanceOf(AppointmentInvalidDateRangeException);
      expect(calendarAccessService.assertCanRead).not.toHaveBeenCalled();
    });
  });

  describe('conflicts and overlaps', () => {
    const createDto = {
      userServiceId: 'user-service-uuid',
      scheduledAt: '2026-11-02T10:00:00.000Z',
      clientEmail: 'jan@example.com',
    };

    const internalDto = {
      calendarId: 'calendar-uuid',
      ownerId: 'employee-uuid',
      name: 'Spotkanie z dostawcą',
      scheduledAt: '2026-11-02T10:00:00.000Z',
      scheduledEndAt: '2026-11-02T10:45:00.000Z',
    };

    const ownCalendar = {
      uuid: 'calendar-uuid',
      owner: { uuid: 'employee-uuid' },
    };

    let internalEvent: Appointment;

    beforeEach(() => {
      internalEvent = createAppointment({
        uuid: 'internal-uuid',
        name: 'Szkolenie',
        type: AppointmentType.INTERNAL,
        status: AppointmentStatus.CONFIRMED,
        scheduledAt: new Date('2026-11-02T10:30:00.000Z'),
        scheduledEndAt: new Date('2026-11-02T12:00:00.000Z'),
      });
      usersServicesRepository.findOne.mockResolvedValue(createUserService());
      calendarRepository.findOneBy.mockResolvedValue(ownCalendar);
      calendarRepository.findOne.mockResolvedValue(ownCalendar);
      userRepository.findOneBy.mockResolvedValue({ uuid: 'employee-uuid' });
    });

    it('checks client conflicts per employee inside locked transaction', async () => {
      await service.create(createDto);

      expect(dataSource.transaction).toHaveBeenCalled();
      expect(lockQueryBuilder.setLock).toHaveBeenCalledWith(
        'pessimistic_write',
      );
      expect(lockQueryBuilder.where).toHaveBeenCalledWith(
        'user.uuid = :employeeUuid',
        { employeeUuid: 'employee-uuid' },
      );
      expect(conflictQueryBuilder.where).toHaveBeenCalledWith(
        'calendar.owner = :employeeUuid',
        { employeeUuid: 'employee-uuid' },
      );
      expect(conflictQueryBuilder.andWhere).toHaveBeenCalledWith(
        'appointment.type = :type',
        { type: AppointmentType.CLIENT },
      );
    });

    it('rejects client booking colliding with another client appointment', async () => {
      conflictQueryBuilder.getOne.mockResolvedValue(createAppointment());

      await expect(service.create(createDto)).rejects.toBeInstanceOf(
        AppointmentConflictException,
      );
      expect(appointmentRepository.save).not.toHaveBeenCalled();
      expect(mailService.sendAppointmentCreatedToClient).not.toHaveBeenCalled();
    });

    it('reports internal events overlapping new client booking', async () => {
      conflictQueryBuilder.getMany.mockResolvedValue([internalEvent]);

      const { data } = await service.create(createDto);

      expect(data.overlaps).toEqual([
        {
          uuid: 'internal-uuid',
          name: 'Szkolenie',
          type: AppointmentType.INTERNAL,
          status: AppointmentStatus.CONFIRMED,
          scheduledAt: internalEvent.scheduledAt,
          scheduledEndAt: internalEvent.scheduledEndAt,
        },
      ]);
    });

    it('saves internal event without conflict check even when slot is taken', async () => {
      conflictQueryBuilder.getOne.mockResolvedValue(createAppointment());

      await service.createInternal(internalDto);

      expect(dataSource.transaction).not.toHaveBeenCalled();
      expect(conflictQueryBuilder.getOne).not.toHaveBeenCalled();
      expect(appointmentRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ type: AppointmentType.INTERNAL }),
      );
    });

    it('reports client appointments overlapping new internal event', async () => {
      conflictQueryBuilder.getMany.mockResolvedValue([createAppointment()]);

      const { data } = await service.createInternal(internalDto);

      expect(data.overlaps).toEqual([
        expect.objectContaining({
          uuid: 'appointment-uuid',
          type: AppointmentType.CLIENT,
        }),
      ]);
    });

    it('moves internal event without conflict check', async () => {
      appointmentRepository.findOne.mockResolvedValue(internalEvent);

      await service.update('internal-uuid', {
        scheduledAt: '2026-11-02T11:00:00.000Z',
      });

      expect(dataSource.transaction).not.toHaveBeenCalled();
      expect(appointmentRepository.save).toHaveBeenCalled();
    });

    it('does not check conflicts when client appointment dates do not change', async () => {
      appointmentRepository.findOne.mockResolvedValue(createAppointment());

      await service.update('appointment-uuid', { note: 'Nowa notatka' });

      expect(dataSource.transaction).not.toHaveBeenCalled();
    });

    it('reschedules client appointment inside locked transaction', async () => {
      appointmentRepository.findOne.mockResolvedValue(createAppointment());

      await service.reschedule('appointment-uuid', {
        scheduledAt: '2026-11-03T10:00:00.000Z',
        scheduledEndAt: '2026-11-03T11:00:00.000Z',
        rescheduledBy: RescheduledBy.STAFF,
      });

      expect(dataSource.transaction).toHaveBeenCalled();
      expect(conflictQueryBuilder.andWhere).toHaveBeenCalledWith(
        'appointment.uuid != :excludeUuid',
        { excludeUuid: 'appointment-uuid' },
      );
    });

    it('find returns only overlapping events of the same employee', async () => {
      appointmentRepository.findOne.mockResolvedValue(createAppointment());
      conflictQueryBuilder.getMany.mockResolvedValue([
        createAppointment(),
        internalEvent,
        createAppointment({
          uuid: 'other-employee-uuid',
          calendar: { uuid: 'other', owner: { uuid: 'other-employee' } },
        } as Partial<Appointment>),
        createAppointment({
          uuid: 'later-uuid',
          scheduledAt: new Date('2026-11-02T11:00:00.000Z'),
          scheduledEndAt: new Date('2026-11-02T12:00:00.000Z'),
        }),
      ]);

      const { data } = await service.find('appointment-uuid');

      expect(data.overlaps.map(overlap => overlap.uuid)).toEqual([
        'internal-uuid',
      ]);
    });

    it('find skips overlap lookup for cancelled appointment', async () => {
      appointmentRepository.findOne.mockResolvedValue(
        createAppointment({ status: AppointmentStatus.CANCELLED }),
      );

      const { data } = await service.find('appointment-uuid');

      expect(data.overlaps).toEqual([]);
      expect(conflictQueryBuilder.getMany).not.toHaveBeenCalled();
    });
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

    it('stores logged in user as creator', async () => {
      await service.create(dto, { createdByUuid: 'receptionist-uuid' });

      expect(appointmentRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ createdBy: { uuid: 'receptionist-uuid' } }),
      );
    });

    it('leaves creator empty when booking has no logged in user', async () => {
      await service.create(dto);

      expect(appointmentRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ createdBy: null }),
      );
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

    it('stores logged in user as creator of internal event', async () => {
      await service.createInternal(dto, 'manager-uuid');

      expect(appointmentRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ createdBy: { uuid: 'manager-uuid' } }),
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

    it('stores reschedule reason without overwriting client note', async () => {
      appointmentRepository.findOne.mockResolvedValue(
        createAppointment({ note: 'Proszę o kontakt telefoniczny' }),
      );

      await service.reschedule('appointment-uuid', {
        ...dto,
        rescheduleReason: 'Choroba pracownika',
      });

      expect(appointmentRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          note: 'Proszę o kontakt telefoniczny',
          rescheduleReason: 'Choroba pracownika',
        }),
      );
      expect(
        mailService.sendAppointmentRescheduledToClient,
      ).toHaveBeenCalledWith(
        'jan@example.com',
        expect.objectContaining({ rescheduleReason: 'Choroba pracownika' }),
      );
    });

    it('clears reason of previous reschedule', async () => {
      appointmentRepository.findOne.mockResolvedValue(
        createAppointment({ rescheduleReason: 'Stary powód' }),
      );

      await service.reschedule('appointment-uuid', dto);

      expect(appointmentRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ rescheduleReason: null }),
      );
    });
  });

  describe('opening hours and booking rules', () => {
    const dto = {
      userServiceId: 'user-service-uuid',
      scheduledAt: '2026-11-02T10:00:00.000Z',
      clientEmail: 'jan@example.com',
    };

    const lunchBreakDay = [
      { opensAt: '09:00', closesAt: '13:00' },
      { opensAt: '14:00', closesAt: '18:00' },
    ];

    const wholeDay = [{ opensAt: '00:00', closesAt: '23:59' }];

    beforeEach(() => {
      usersServicesRepository.findOne.mockResolvedValue(createUserService());
      calendarRepository.findOneBy.mockResolvedValue({ uuid: 'calendar-uuid' });
      salonService.findOpeningRanges.mockResolvedValue(lunchBreakDay);
    });

    it('accepts appointment within opening range in salon time', async () => {
      // 10:00 UTC is 11:00 in Warsaw in November
      await service.create(dto);

      expect(salonService.findOpeningRanges).toHaveBeenCalledWith(
        salon,
        '2026-11-02',
      );
      expect(appointmentRepository.save).toHaveBeenCalled();
    });

    it('accepts appointment ending exactly at closing time', async () => {
      await service.create({ ...dto, scheduledAt: '2026-11-02T16:00:00.000Z' });

      expect(appointmentRepository.save).toHaveBeenCalled();
    });

    it('rejects appointment during lunch break', async () => {
      await expect(
        service.create({ ...dto, scheduledAt: '2026-11-02T11:30:00.000Z' }),
      ).rejects.toThrow(
        'Wizyta musi mieścić się w godzinach otwarcia salonu w dniu 2026-11-02: 09:00-13:00, 14:00-18:00',
      );
      expect(appointmentRepository.save).not.toHaveBeenCalled();
    });

    it('rejects appointment ending after closing time', async () => {
      await expect(
        service.create({ ...dto, scheduledAt: '2026-11-02T16:30:00.000Z' }),
      ).rejects.toBeInstanceOf(AppointmentOutsideOpeningHoursException);
    });

    it('rejects appointment on closed day', async () => {
      salonService.findOpeningRanges.mockResolvedValue([]);

      await expect(service.create(dto)).rejects.toThrow(
        'Salon jest zamknięty w dniu 2026-11-02',
      );
    });

    it('uses salon local date near midnight', async () => {
      salonService.findOpeningRanges.mockResolvedValue([]);

      // 23:30 UTC on Nov 2 is already Nov 3 in Warsaw
      await expect(
        service.create({ ...dto, scheduledAt: '2026-11-02T23:30:00.000Z' }),
      ).rejects.toBeInstanceOf(AppointmentOutsideOpeningHoursException);
      expect(salonService.findOpeningRanges).toHaveBeenCalledWith(
        salon,
        '2026-11-03',
      );
    });

    it('applies daylight saving time offset', async () => {
      salonService.findOpeningRanges.mockResolvedValue([
        { opensAt: '09:00', closesAt: '18:00' },
      ]);

      // 07:00 UTC is 09:00 in Warsaw in summer
      await service.create({ ...dto, scheduledAt: '2027-07-01T07:00:00.000Z' });

      expect(appointmentRepository.save).toHaveBeenCalled();
    });

    it('applies opening hours to staff bookings', async () => {
      await expect(
        service.create(
          { ...dto, scheduledAt: '2026-11-02T06:00:00.000Z' },
          { createdByUuid: 'receptionist-uuid' },
        ),
      ).rejects.toBeInstanceOf(AppointmentOutsideOpeningHoursException);
    });

    it('does not check opening hours for internal events', async () => {
      userRepository.findOneBy.mockResolvedValue({ uuid: 'employee-uuid' });
      calendarRepository.findOne.mockResolvedValue({
        uuid: 'calendar-uuid',
        owner: { uuid: 'employee-uuid' },
      });

      await service.createInternal({
        calendarId: 'calendar-uuid',
        ownerId: 'employee-uuid',
        name: 'Inwentaryzacja',
        scheduledAt: '2026-11-02T20:00:00.000Z',
        scheduledEndAt: '2026-11-02T22:00:00.000Z',
      });

      expect(salonService.findOpeningRanges).not.toHaveBeenCalled();
      expect(appointmentRepository.save).toHaveBeenCalled();
    });

    it('checks opening hours when client appointment dates change', async () => {
      appointmentRepository.findOne.mockResolvedValue(createAppointment());

      await expect(
        service.update('appointment-uuid', {
          scheduledAt: '2026-11-02T18:00:00.000Z',
          scheduledEndAt: '2026-11-02T19:00:00.000Z',
        }),
      ).rejects.toBeInstanceOf(AppointmentOutsideOpeningHoursException);
    });

    it('does not check opening hours when only note changes', async () => {
      appointmentRepository.findOne.mockResolvedValue(createAppointment());

      await service.update('appointment-uuid', { note: 'Nowa notatka' });

      expect(salonService.findOpeningRanges).not.toHaveBeenCalled();
    });

    it('does not check opening hours when internal event moves', async () => {
      appointmentRepository.findOne.mockResolvedValue(
        createAppointment({ type: AppointmentType.INTERNAL }),
      );

      await service.update('appointment-uuid', {
        scheduledAt: '2026-11-02T20:00:00.000Z',
        scheduledEndAt: '2026-11-02T21:00:00.000Z',
      });

      expect(salonService.findOpeningRanges).not.toHaveBeenCalled();
    });

    it('checks opening hours when client appointment is rescheduled', async () => {
      appointmentRepository.findOne.mockResolvedValue(createAppointment());

      await expect(
        service.reschedule('appointment-uuid', {
          scheduledAt: '2026-11-03T05:00:00.000Z',
          scheduledEndAt: '2026-11-03T06:00:00.000Z',
          rescheduledBy: RescheduledBy.STAFF,
        }),
      ).rejects.toBeInstanceOf(AppointmentOutsideOpeningHoursException);
      expect(appointmentRepository.save).not.toHaveBeenCalled();
    });

    it('uses lead time from salon settings', async () => {
      salonService.getBookingSettings.mockResolvedValue({
        ...salon,
        clientMinLeadTimeMinutes: 180,
      });
      salonService.findOpeningRanges.mockResolvedValue(wholeDay);
      const in2Hours = new Date(NOW.getTime() + 120 * 60 * 1000);

      await expect(
        service.create(
          { ...dto, scheduledAt: in2Hours.toISOString() },
          { bookedByClient: true },
        ),
      ).rejects.toThrow('najpóźniej 180 minut');
    });

    it('rejects client booking beyond booking horizon', async () => {
      salonService.findOpeningRanges.mockResolvedValue(wholeDay);
      const in61Days = new Date(NOW.getTime() + 61 * 24 * 60 * 60 * 1000);

      await expect(
        service.create(
          { ...dto, scheduledAt: in61Days.toISOString() },
          { bookedByClient: true },
        ),
      ).rejects.toBeInstanceOf(AppointmentBeyondBookingHorizonException);
    });

    it('allows staff to book beyond booking horizon', async () => {
      salonService.findOpeningRanges.mockResolvedValue(wholeDay);
      const in61Days = new Date(NOW.getTime() + 61 * 24 * 60 * 60 * 1000);

      await service.create({ ...dto, scheduledAt: in61Days.toISOString() });

      expect(appointmentRepository.save).toHaveBeenCalled();
    });
  });

  describe('client bookings', () => {
    const dto = {
      userServiceId: 'user-service-uuid',
      scheduledAt: '2026-11-02T10:00:00.000Z',
      clientEmail: 'jan@example.com',
      clientName: 'Jan Kowalski',
    };

    beforeEach(() => {
      usersServicesRepository.findOne.mockResolvedValue(createUserService());
      calendarRepository.findOneBy.mockResolvedValue({ uuid: 'calendar-uuid' });
    });

    it('stores guest name and uses it in mails', async () => {
      await service.create(dto, { bookedByClient: true });

      expect(appointmentRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ clientName: 'Jan Kowalski' }),
      );
      expect(mailService.sendAppointmentCreatedToEmployee).toHaveBeenCalledWith(
        'anna@hairdresser.pl',
        expect.objectContaining({ clientName: 'Jan Kowalski' }),
      );
    });

    it('ignores guest name when booking is linked to client account', async () => {
      clientRepository.findOneBy.mockResolvedValue({
        uuid: 'client-uuid',
        firstName: 'Ewa',
        lastName: 'Nowak',
        email: 'ewa@example.com',
      });

      await service.create(dto, {
        clientUuid: 'client-uuid',
        bookedByClient: true,
      });

      expect(appointmentRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          clientName: null,
          clientEmail: 'ewa@example.com',
        }),
      );
    });

    it('keeps client booking pending without auto confirmation', async () => {
      const result = await service.create(dto, { bookedByClient: true });

      expect(result.data.status).toBe(AppointmentStatus.PENDING);
      expect(mailService.sendAppointmentCreatedToClient).toHaveBeenCalled();
      expect(
        mailService.sendAppointmentConfirmedToClient,
      ).not.toHaveBeenCalled();
    });

    it('confirms client booking when salon auto confirms', async () => {
      salonService.getBookingSettings.mockResolvedValue({
        ...salon,
        autoConfirmClientBookings: true,
      });

      const result = await service.create(dto, { bookedByClient: true });

      expect(result.data.status).toBe(AppointmentStatus.CONFIRMED);
      expect(appointmentRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: AppointmentStatus.CONFIRMED }),
      );
      expect(mailService.sendAppointmentConfirmedToClient).toHaveBeenCalledWith(
        'jan@example.com',
        expect.any(Object),
      );
      expect(mailService.sendAppointmentCreatedToClient).not.toHaveBeenCalled();
    });

    it('does not auto confirm bookings made by staff', async () => {
      salonService.getBookingSettings.mockResolvedValue({
        ...salon,
        autoConfirmClientBookings: true,
      });

      const result = await service.create(dto);

      expect(result.data.status).toBe(AppointmentStatus.PENDING);
    });
  });

  describe('client mail manage link', () => {
    beforeEach(() => {
      usersServicesRepository.findOne.mockResolvedValue(createUserService());
      calendarRepository.findOneBy.mockResolvedValue({ uuid: 'calendar-uuid' });
    });

    it('adds manage link to client mail but not to employee mail', async () => {
      await service.create({
        userServiceId: 'user-service-uuid',
        scheduledAt: '2026-11-02T10:00:00.000Z',
        clientEmail: 'jan@example.com',
      });
      await flushMails();

      expect(bookingAccessService.createManageUrl).toHaveBeenCalledWith(
        'jan@example.com',
      );
      expect(mailService.sendAppointmentCreatedToClient).toHaveBeenCalledWith(
        'jan@example.com',
        expect.objectContaining({
          manageUrl: 'https://reve.pl/moje-wizyty/token',
        }),
      );
      expect(
        mailService.sendAppointmentCreatedToEmployee.mock.calls[0][1],
      ).not.toHaveProperty('manageUrl');
    });

    it('adds manage link to reschedule and cancel mails', async () => {
      appointmentRepository.findOne.mockResolvedValue(createAppointment());

      await service.reschedule('appointment-uuid', {
        scheduledAt: '2026-11-03T10:00:00.000Z',
        scheduledEndAt: '2026-11-03T11:00:00.000Z',
        rescheduledBy: RescheduledBy.STAFF,
      });
      appointmentRepository.findOne.mockResolvedValue(createAppointment());
      await service.cancel('appointment-uuid', {
        cancelledBy: CancelledBy.STAFF,
      });
      await flushMails();

      expect(
        mailService.sendAppointmentRescheduledToClient.mock.calls[0][1]
          .manageUrl,
      ).toBe('https://reve.pl/moje-wizyty/token');
      expect(
        mailService.sendAppointmentCancelledToClient.mock.calls[0][1].manageUrl,
      ).toBe('https://reve.pl/moje-wizyty/token');
    });

    it('adds account link only for appointments of client accounts', async () => {
      clientRepository.findOneBy.mockResolvedValue({
        uuid: 'client-uuid',
        firstName: 'Ewa',
        lastName: 'Nowak',
        email: 'ewa@example.com',
      });

      await service.create(
        {
          userServiceId: 'user-service-uuid',
          scheduledAt: '2026-11-02T10:00:00.000Z',
        },
        { clientUuid: 'client-uuid' },
      );
      await service.create({
        userServiceId: 'user-service-uuid',
        scheduledAt: '2026-11-03T10:00:00.000Z',
        clientEmail: 'jan@example.com',
      });
      await flushMails();

      const [accountMail, guestMail] =
        mailService.sendAppointmentCreatedToClient.mock.calls;
      expect(accountMail[1].accountUrl).toBe('https://reve.pl/konto');
      expect(guestMail[1].accountUrl).toBeUndefined();
    });

    it('still sends client mail when link cannot be created', async () => {
      bookingAccessService.createManageUrl.mockResolvedValue(null);

      await service.create({
        userServiceId: 'user-service-uuid',
        scheduledAt: '2026-11-02T10:00:00.000Z',
        clientEmail: 'jan@example.com',
      });
      await flushMails();

      expect(
        mailService.sendAppointmentCreatedToClient.mock.calls[0][1].manageUrl,
      ).toBeUndefined();
    });

    it('applies client rules when client reschedules', async () => {
      appointmentRepository.findOne.mockResolvedValue(createAppointment());
      const in30Minutes = new Date(NOW.getTime() + 30 * 60 * 1000);

      await expect(
        service.reschedule(
          'appointment-uuid',
          {
            scheduledAt: in30Minutes.toISOString(),
            scheduledEndAt: new Date(
              in30Minutes.getTime() + 60 * 60 * 1000,
            ).toISOString(),
            rescheduledBy: RescheduledBy.CLIENT,
          },
          { bookedByClient: true },
        ),
      ).rejects.toBeInstanceOf(AppointmentLeadTimeException);
    });
  });

  describe('audit log', () => {
    beforeEach(() => {
      usersServicesRepository.findOne.mockResolvedValue(createUserService());
      calendarRepository.findOneBy.mockResolvedValue({ uuid: 'calendar-uuid' });
    });

    it('records created client appointment with guest label', async () => {
      await service.create(
        {
          userServiceId: 'user-service-uuid',
          scheduledAt: '2026-11-02T10:00:00.000Z',
          clientEmail: 'jan@example.com',
        },
        { bookedByClient: true },
      );

      expect(auditLogService.record).toHaveBeenCalledWith({
        action: 'appointment.created',
        entityType: 'appointment',
        entityId: 'new-appointment-uuid',
        metadata: {
          type: AppointmentType.CLIENT,
          status: AppointmentStatus.PENDING,
          bookedByClient: true,
        },
        guestLabel: 'jan@example.com',
      });
    });

    it('does not record failed operations', async () => {
      conflictQueryBuilder.getOne.mockResolvedValue({ uuid: 'other' });

      await expect(
        service.create({
          userServiceId: 'user-service-uuid',
          scheduledAt: '2026-11-02T10:00:00.000Z',
          clientEmail: 'jan@example.com',
        }),
      ).rejects.toBeInstanceOf(AppointmentConflictException);
      expect(auditLogService.record).not.toHaveBeenCalled();
    });

    it('records cancellation with reason', async () => {
      appointmentRepository.findOne.mockResolvedValue(createAppointment());

      await service.cancel('appointment-uuid', {
        cancelledBy: CancelledBy.CLIENT,
        cancellationReason: 'Zmiana planów',
      });

      expect(auditLogService.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'appointment.cancelled',
          entityId: 'appointment-uuid',
          metadata: {
            cancelledBy: CancelledBy.CLIENT,
            reason: 'Zmiana planów',
          },
        }),
      );
    });

    it('records confirmation as its own action', async () => {
      appointmentRepository.findOne.mockResolvedValue(createAppointment());

      await service.update('appointment-uuid', {
        status: AppointmentStatus.CONFIRMED,
      });

      expect(auditActions()).toEqual(['appointment.confirmed']);
      expect(auditLogService.record.mock.calls[0][0].metadata).toEqual({
        fields: ['status'],
      });
    });

    it('records other changes as update with changed field names', async () => {
      appointmentRepository.findOne.mockResolvedValue(createAppointment());

      await service.update('appointment-uuid', { note: 'Nowa notatka' });

      expect(auditActions()).toEqual(['appointment.updated']);
      expect(auditLogService.record.mock.calls[0][0].metadata).toEqual({
        fields: ['note'],
      });
    });

    it('records reschedule and delete', async () => {
      appointmentRepository.findOne.mockResolvedValue(createAppointment());
      await service.reschedule('appointment-uuid', {
        scheduledAt: '2026-11-03T10:00:00.000Z',
        scheduledEndAt: '2026-11-03T11:00:00.000Z',
        rescheduledBy: RescheduledBy.STAFF,
      });

      appointmentRepository.findOne.mockResolvedValue(createAppointment());
      await service.remove('appointment-uuid');

      expect(auditActions()).toEqual([
        'appointment.rescheduled',
        'appointment.deleted',
      ]);
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
