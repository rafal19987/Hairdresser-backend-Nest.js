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
    conflictQueryBuilder.getOne.mockResolvedValue(null);
    appointmentRepository.save.mockImplementation(async entity => entity);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppointmentsService,
        {
          provide: getRepositoryToken(Appointment),
          useValue: appointmentRepository,
        },
        { provide: getRepositoryToken(Calendar), useValue: {} },
        { provide: getRepositoryToken(User), useValue: {} },
        { provide: getRepositoryToken(Client), useValue: {} },
        { provide: getRepositoryToken(UsersServices), useValue: {} },
        { provide: MailService, useValue: mailService },
      ],
    }).compile();

    service = module.get<AppointmentsService>(AppointmentsService);
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
