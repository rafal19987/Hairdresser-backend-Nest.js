import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BookingManageService } from '@/booking/booking-manage.service';
import { Appointment } from '@/appointment/entities/appointment.entity';
import { AppointmentStatus } from '@/appointment/enums/appointment-status.enum';
import { CancelledBy } from '@/appointment/enums/appointment-cancelled-by.enum';
import { RescheduledBy } from '@/appointment/enums/appointment-rescheduled-by.enum';
import { APPOINTMENTS_SERVICE } from '@/appointment/interfaces/appointments-service.interface';
import { AppointmentNotFoundException } from '@/appointment/exceptions/appointment-not-found.exception';
import { AppointmentNotModifiableException } from '@/appointment/exceptions/appointment-not-modifiable.exception';
import { SALON_SERVICE } from '@/salon/interfaces/salon-service.interface';
import { BookingAccessService } from '@/booking-access/booking-access.service';
import { MailService } from '@/mail/mail.service';
import { BookingChangeDeadlinePassedException } from '@/booking/exceptions/booking-change-deadline-passed.exception';

const NOW = new Date('2026-11-01T08:00:00.000Z');
const EMAIL = 'jan@example.com';

const createAppointment = (overrides: Record<string, unknown> = {}) => ({
  uuid: 'appointment-uuid',
  name: 'Strzyżenie — Anna Nowak',
  status: AppointmentStatus.CONFIRMED,
  scheduledAt: new Date('2026-11-03T10:00:00.000Z'),
  scheduledEndAt: new Date('2026-11-03T11:00:00.000Z'),
  price: 120,
  duration: 60,
  userService: {
    uuid: 'user-service-uuid',
    service: { uuid: 'service-uuid', name: 'Strzyżenie' },
    user: { uuid: 'anna', firstName: 'Anna', lastName: 'Nowak' },
  },
  ...overrides,
});

describe('BookingManageService', () => {
  let service: BookingManageService;

  const queryBuilder = {
    leftJoin: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
    getOne: jest.fn(),
    getExists: jest.fn(),
  };
  const appointmentRepository = {
    createQueryBuilder: jest.fn(() => queryBuilder),
  };
  const appointmentsService = { cancel: jest.fn(), reschedule: jest.fn() };
  const salonService = { getBookingSettings: jest.fn() };
  const bookingAccessService = { createManageUrl: jest.fn() };
  const mailService = { sendBookingManageLink: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    jest.spyOn(Date, 'now').mockReturnValue(NOW.getTime());
    salonService.getBookingSettings.mockResolvedValue({
      clientCancellationDeadlineHours: 24,
    });
    queryBuilder.getOne.mockResolvedValue(createAppointment());
    bookingAccessService.createManageUrl.mockResolvedValue(
      'https://reve.pl/moje-wizyty/token',
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingManageService,
        {
          provide: getRepositoryToken(Appointment),
          useValue: appointmentRepository,
        },
        { provide: APPOINTMENTS_SERVICE, useValue: appointmentsService },
        { provide: SALON_SERVICE, useValue: salonService },
        { provide: BookingAccessService, useValue: bookingAccessService },
        { provide: MailService, useValue: mailService },
      ],
    }).compile();

    service = module.get<BookingManageService>(BookingManageService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('findAppointments', () => {
    it('matches guest and account appointments by email', async () => {
      queryBuilder.getMany.mockResolvedValue([]);

      await service.findAppointments(EMAIL);

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        '(LOWER(appointment.clientEmail) = :email OR LOWER(client.email) = :email)',
        { email: EMAIL },
      );
    });

    it('splits upcoming and history and marks what can be changed', async () => {
      queryBuilder.getMany.mockResolvedValue([
        createAppointment({
          uuid: 'later',
          scheduledAt: new Date('2026-11-10T10:00:00.000Z'),
          scheduledEndAt: new Date('2026-11-10T11:00:00.000Z'),
        }),
        createAppointment({
          uuid: 'tomorrow',
          scheduledAt: new Date('2026-11-02T07:00:00.000Z'),
          scheduledEndAt: new Date('2026-11-02T08:00:00.000Z'),
        }),
        createAppointment({
          uuid: 'cancelled',
          status: AppointmentStatus.CANCELLED,
        }),
        createAppointment({
          uuid: 'done',
          status: AppointmentStatus.COMPLETED,
          scheduledAt: new Date('2026-10-20T10:00:00.000Z'),
          scheduledEndAt: new Date('2026-10-20T11:00:00.000Z'),
        }),
      ]);

      const { data } = await service.findAppointments(EMAIL);

      expect(data.upcoming.map(a => a.uuid)).toEqual(['tomorrow', 'later']);
      expect(data.past.map(a => a.uuid)).toEqual(['cancelled', 'done']);
      expect(data.upcoming[1]).toEqual({
        uuid: 'later',
        status: AppointmentStatus.CONFIRMED,
        startsAt: '2026-11-10T10:00:00.000Z',
        endsAt: '2026-11-10T11:00:00.000Z',
        serviceId: 'service-uuid',
        serviceName: 'Strzyżenie',
        employeeId: 'anna',
        employeeName: 'Anna Nowak',
        price: 120,
        duration: 60,
        changeableUntil: '2026-11-09T10:00:00.000Z',
      });
      // Starts in less than 24 hours
      expect(data.upcoming[0].changeableUntil).toBeNull();
      expect(data.past[0].changeableUntil).toBeNull();
    });
  });

  describe('cancelAppointment', () => {
    it('cancels own appointment as client', async () => {
      await service.cancelAppointment(EMAIL, 'appointment-uuid', {
        reason: 'Zmiana planów',
      });

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'appointment.uuid = :uuid',
        { uuid: 'appointment-uuid' },
      );
      expect(appointmentsService.cancel).toHaveBeenCalledWith(
        'appointment-uuid',
        {
          cancelledBy: CancelledBy.CLIENT,
          cancellationReason: 'Zmiana planów',
        },
      );
    });

    it('hides appointments of other emails', async () => {
      queryBuilder.getOne.mockResolvedValue(null);

      await expect(
        service.cancelAppointment(EMAIL, 'appointment-uuid', {}),
      ).rejects.toBeInstanceOf(AppointmentNotFoundException);
      expect(appointmentsService.cancel).not.toHaveBeenCalled();
    });

    it('rejects cancelling after the deadline', async () => {
      queryBuilder.getOne.mockResolvedValue(
        createAppointment({
          scheduledAt: new Date('2026-11-02T07:00:00.000Z'),
        }),
      );

      await expect(
        service.cancelAppointment(EMAIL, 'appointment-uuid', {}),
      ).rejects.toThrow(new BookingChangeDeadlinePassedException(24));
    });

    it.each([AppointmentStatus.CANCELLED, AppointmentStatus.COMPLETED])(
      'rejects %s appointment',
      async status => {
        queryBuilder.getOne.mockResolvedValue(createAppointment({ status }));

        await expect(
          service.cancelAppointment(EMAIL, 'appointment-uuid', {}),
        ).rejects.toBeInstanceOf(AppointmentNotModifiableException);
      },
    );
  });

  describe('rescheduleAppointment', () => {
    it('moves appointment keeping its duration and client rules', async () => {
      const result = await service.rescheduleAppointment(
        EMAIL,
        'appointment-uuid',
        { startsAt: '2026-11-04T09:00:00.000Z' },
      );

      expect(appointmentsService.reschedule).toHaveBeenCalledWith(
        'appointment-uuid',
        {
          scheduledAt: '2026-11-04T09:00:00.000Z',
          scheduledEndAt: '2026-11-04T10:00:00.000Z',
          rescheduledBy: RescheduledBy.CLIENT,
        },
        { bookedByClient: true },
      );
      expect(result.data).toEqual({
        uuid: 'appointment-uuid',
        status: AppointmentStatus.RESCHEDULED,
        startsAt: '2026-11-04T09:00:00.000Z',
        endsAt: '2026-11-04T10:00:00.000Z',
      });
    });

    it('rejects rescheduling after the deadline', async () => {
      salonService.getBookingSettings.mockResolvedValue({
        clientCancellationDeadlineHours: 72,
      });

      await expect(
        service.rescheduleAppointment(EMAIL, 'appointment-uuid', {
          startsAt: '2026-11-04T09:00:00.000Z',
        }),
      ).rejects.toBeInstanceOf(BookingChangeDeadlinePassedException);
      expect(appointmentsService.reschedule).not.toHaveBeenCalled();
    });
  });

  describe('sendManageLink', () => {
    it('mails link when email has appointments', async () => {
      queryBuilder.getExists.mockResolvedValue(true);

      const result = await service.sendManageLink(' Jan@Example.com ');

      expect(bookingAccessService.createManageUrl).toHaveBeenCalledWith(EMAIL);
      expect(mailService.sendBookingManageLink).toHaveBeenCalledWith(
        EMAIL,
        'https://reve.pl/moje-wizyty/token',
      );
      expect(result.statusCode).toBe(200);
    });

    it('answers the same without appointments and sends nothing', async () => {
      queryBuilder.getExists.mockResolvedValue(false);

      const result = await service.sendManageLink(EMAIL);

      expect(mailService.sendBookingManageLink).not.toHaveBeenCalled();
      expect(result.statusCode).toBe(200);
    });

    it('answers the same when mail fails', async () => {
      queryBuilder.getExists.mockResolvedValue(true);
      mailService.sendBookingManageLink.mockRejectedValue(new Error('SMTP'));

      const result = await service.sendManageLink(EMAIL);

      expect(result.statusCode).toBe(200);
    });
  });
});
