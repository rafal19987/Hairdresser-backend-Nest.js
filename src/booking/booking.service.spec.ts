import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BookingService } from '@/booking/booking.service';
import { Appointment } from '@/appointment/entities/appointment.entity';
import { AppointmentType } from '@/appointment/enums/appointment-type.enum';
import { Service } from '@/services/entities/service.entity';
import { UsersServices } from '@/users-services/entities/users-services.entity';
import { SALON_SERVICE } from '@/salon/interfaces/salon-service.interface';
import { ServiceNotFoundException } from '@/services/exceptions/service-not-found.exception';
import { BookingEmployeeUnavailableException } from '@/booking/exceptions/booking-employee-unavailable.exception';
import { BookingGuestDetailsRequiredException } from '@/booking/exceptions/booking-guest-details-required.exception';
import { BookingClientAccountUnavailableException } from '@/booking/exceptions/booking-client-account-unavailable.exception';
import { Client } from '@/clients/entities/client.entity';
import { APPOINTMENTS_SERVICE } from '@/appointment/interfaces/appointments-service.interface';
import { AppointmentStatus } from '@/appointment/enums/appointment-status.enum';

// Sunday; Warsaw is UTC+1 in November
const NOW = new Date('2026-11-01T08:00:00.000Z');
const MONDAY = '2026-11-02';

const createOffer = (employeeId: string, duration: number | string = 60) => ({
  userServiceId: `${employeeId}-service`,
  employeeId,
  duration,
});

const createBusy = (employeeId: string, startsAt: string, endsAt: string) => ({
  employeeId,
  startsAt: new Date(startsAt),
  endsAt: new Date(endsAt),
});

describe('BookingService', () => {
  let service: BookingService;

  const salon = {
    uuid: 'salon-uuid',
    timeZone: 'Europe/Warsaw',
    clientMinLeadTimeMinutes: 60,
    maxBookingDaysAhead: 60,
    slotIntervalMinutes: 30,
  };

  const createQueryBuilder = () => ({
    innerJoin: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    distinct: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    addGroupBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    getRawMany: jest.fn(),
  });

  const offersQueryBuilder = createQueryBuilder();
  const busyQueryBuilder = createQueryBuilder();

  const serviceRepository = { exists: jest.fn() };
  const usersServicesRepository = {
    createQueryBuilder: jest.fn(() => offersQueryBuilder),
  };
  const appointmentRepository = {
    createQueryBuilder: jest.fn(() => busyQueryBuilder),
  };
  const salonService = {
    getBookingSettings: jest.fn(),
    findOpeningRanges: jest.fn(),
  };
  const clientRepository = { exists: jest.fn() };
  const appointmentsService = { create: jest.fn() };

  const findSlots = async (query: Record<string, string> = {}) =>
    (
      await service.findAvailableSlots({
        serviceId: 'service-uuid',
        date: MONDAY,
        ...query,
      })
    ).data;

  const times = (slots: { time: string }[]) => slots.map(slot => slot.time);

  beforeEach(async () => {
    jest.clearAllMocks();
    jest.spyOn(Date, 'now').mockReturnValue(NOW.getTime());

    serviceRepository.exists.mockResolvedValue(true);
    offersQueryBuilder.getRawMany.mockResolvedValue([createOffer('anna')]);
    busyQueryBuilder.getRawMany.mockResolvedValue([]);
    salonService.getBookingSettings.mockResolvedValue(salon);
    salonService.findOpeningRanges.mockResolvedValue([
      { opensAt: '09:00', closesAt: '11:00' },
    ]);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingService,
        { provide: getRepositoryToken(Service), useValue: serviceRepository },
        {
          provide: getRepositoryToken(UsersServices),
          useValue: usersServicesRepository,
        },
        {
          provide: getRepositoryToken(Appointment),
          useValue: appointmentRepository,
        },
        { provide: SALON_SERVICE, useValue: salonService },
        { provide: getRepositoryToken(Client), useValue: clientRepository },
        { provide: APPOINTMENTS_SERVICE, useValue: appointmentsService },
      ],
    }).compile();

    service = module.get<BookingService>(BookingService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns minimal slots with local time, UTC start and free assignments', async () => {
    expect(await findSlots()).toEqual({
      date: MONDAY,
      slots: [
        {
          time: '09:00',
          startsAt: '2026-11-02T08:00:00.000Z',
          userServiceIds: ['anna-service'],
        },
        {
          time: '09:30',
          startsAt: '2026-11-02T08:30:00.000Z',
          userServiceIds: ['anna-service'],
        },
        {
          time: '10:00',
          startsAt: '2026-11-02T09:00:00.000Z',
          userServiceIds: ['anna-service'],
        },
      ],
    });
  });

  it('loads assignments and opening hours in parallel', async () => {
    let resolveOffers: (value: unknown) => void;
    offersQueryBuilder.getRawMany.mockReturnValue(
      new Promise(resolve => (resolveOffers = resolve)),
    );

    const result = findSlots();
    await new Promise(resolve => setImmediate(resolve));

    expect(salonService.findOpeningRanges).toHaveBeenCalledWith(salon, MONDAY);
    resolveOffers([createOffer('anna')]);
    await result;
  });

  it('selects only bookable assignments of active employees and service', async () => {
    await findSlots();

    expect(offersQueryBuilder.andWhere).toHaveBeenCalledWith(
      'service.uuid = :serviceId',
      { serviceId: 'service-uuid' },
    );
    expect(offersQueryBuilder.where).toHaveBeenCalledWith(
      'service.active = true',
    );
    expect(offersQueryBuilder.andWhere).toHaveBeenCalledWith(
      'user.active = true',
    );
    expect(serviceRepository.exists).not.toHaveBeenCalled();
  });

  it('throws when service does not exist or is inactive', async () => {
    offersQueryBuilder.getRawMany.mockResolvedValue([]);
    serviceRepository.exists.mockResolvedValue(false);

    await expect(findSlots()).rejects.toBeInstanceOf(ServiceNotFoundException);
  });

  it('throws when selected employee does not offer the service', async () => {
    offersQueryBuilder.getRawMany.mockResolvedValue([]);

    await expect(findSlots({ employeeId: 'tomek' })).rejects.toBeInstanceOf(
      BookingEmployeeUnavailableException,
    );
    expect(offersQueryBuilder.andWhere).toHaveBeenCalledWith(
      'user.uuid = :employeeId',
      { employeeId: 'tomek' },
    );
  });

  it('returns no slots when nobody offers the service', async () => {
    offersQueryBuilder.getRawMany.mockResolvedValue([]);

    expect((await findSlots()).slots).toEqual([]);
  });

  it('returns no slots on closed day without loading appointments', async () => {
    salonService.findOpeningRanges.mockResolvedValue([]);

    expect((await findSlots()).slots).toEqual([]);
    expect(busyQueryBuilder.getRawMany).not.toHaveBeenCalled();
  });

  it('returns no slots for past date without loading appointments', async () => {
    expect((await findSlots({ date: '2026-10-31' })).slots).toEqual([]);
    expect(busyQueryBuilder.getRawMany).not.toHaveBeenCalled();
  });

  it('skips lunch break between opening ranges', async () => {
    salonService.findOpeningRanges.mockResolvedValue([
      { opensAt: '09:00', closesAt: '10:30' },
      { opensAt: '11:30', closesAt: '13:00' },
    ]);

    expect(times((await findSlots()).slots)).toEqual([
      '09:00',
      '09:30',
      '11:30',
      '12:00',
    ]);
  });

  it('uses slot interval from salon settings', async () => {
    salonService.getBookingSettings.mockResolvedValue({
      ...salon,
      slotIntervalMinutes: 15,
    });

    expect(times((await findSlots()).slots)).toEqual([
      '09:00',
      '09:15',
      '09:30',
      '09:45',
      '10:00',
    ]);
  });

  it('hides slots overlapping client appointments of the employee', async () => {
    busyQueryBuilder.getRawMany.mockResolvedValue([
      createBusy(
        'anna',
        '2026-11-02T08:30:00.000Z',
        '2026-11-02T09:30:00.000Z',
      ),
    ]);

    expect(times((await findSlots()).slots)).toEqual([]);

    busyQueryBuilder.getRawMany.mockResolvedValue([
      createBusy(
        'anna',
        '2026-11-02T09:00:00.000Z',
        '2026-11-02T09:30:00.000Z',
      ),
    ]);

    expect(times((await findSlots()).slots)).toEqual(['09:00']);
  });

  it('counts only client appointments that are not cancelled', async () => {
    await findSlots();

    expect(busyQueryBuilder.andWhere).toHaveBeenCalledWith(
      'appointment.type = :type',
      { type: AppointmentType.CLIENT },
    );
    expect(busyQueryBuilder.andWhere).toHaveBeenCalledWith(
      'appointment.status != :cancelled',
      { cancelled: 'cancelled' },
    );
    expect(busyQueryBuilder.andWhere).toHaveBeenCalledWith(
      'appointment.scheduledEndAt > :dayStart',
      { dayStart: new Date('2026-11-01T23:00:00.000Z') },
    );
  });

  it('lists every free assignment for any-employee search', async () => {
    offersQueryBuilder.getRawMany.mockResolvedValue([
      createOffer('anna'),
      createOffer('tomek'),
    ]);
    busyQueryBuilder.getRawMany.mockResolvedValue([
      createBusy(
        'anna',
        '2026-11-02T08:00:00.000Z',
        '2026-11-02T09:00:00.000Z',
      ),
    ]);

    const { slots } = await findSlots();

    expect(slots[0].userServiceIds).toEqual(['tomek-service']);
    expect(slots[2].userServiceIds).toEqual(['anna-service', 'tomek-service']);
  });

  it('fits each employee by their own service duration', async () => {
    // Raw queries may return numbers as strings
    offersQueryBuilder.getRawMany.mockResolvedValue([
      createOffer('anna', '30'),
      createOffer('tomek', 90),
    ]);

    const { slots } = await findSlots();

    expect(times(slots)).toEqual(['09:00', '09:30', '10:00', '10:30']);
    expect(slots[0].userServiceIds).toEqual(['anna-service', 'tomek-service']);
    expect(slots[3].userServiceIds).toEqual(['anna-service']);
  });

  it('respects client lead time for today', async () => {
    salonService.findOpeningRanges.mockResolvedValue([
      { opensAt: '09:00', closesAt: '12:00' },
    ]);
    // 09:00 local; with 60 min lead time first slot is 10:00
    jest
      .spyOn(Date, 'now')
      .mockReturnValue(new Date('2026-11-02T08:00:00.000Z').getTime());

    expect(times((await findSlots()).slots)).toEqual([
      '10:00',
      '10:30',
      '11:00',
    ]);
  });

  it('respects booking horizon', async () => {
    salonService.getBookingSettings.mockResolvedValue({
      ...salon,
      maxBookingDaysAhead: 1,
    });

    // Horizon ends at 2026-11-02 09:00 local
    expect(times((await findSlots()).slots)).toEqual(['09:00']);
  });

  it('applies daylight saving time', async () => {
    const { slots } = await findSlots({ date: '2026-12-01' });
    expect(slots[0].startsAt).toBe('2026-12-01T08:00:00.000Z');

    jest
      .spyOn(Date, 'now')
      .mockReturnValue(new Date('2027-06-01T08:00:00.000Z').getTime());
    const summer = await findSlots({ date: '2027-07-01' });
    expect(summer.slots[0].startsAt).toBe('2027-07-01T07:00:00.000Z');
  });

  describe('findBookableEmployees', () => {
    it('returns bookable employees with price and duration', async () => {
      offersQueryBuilder.getRawMany.mockResolvedValue([
        {
          userServiceId: 'anna-service',
          employeeId: 'anna',
          duration: '45',
          firstName: 'Anna',
          lastName: 'Nowak',
          price: '120.00',
        },
      ]);

      const result = await service.findBookableEmployees('service-uuid');

      expect(result.data).toEqual({
        serviceId: 'service-uuid',
        employees: [
          {
            userServiceId: 'anna-service',
            employeeId: 'anna',
            duration: 45,
            firstName: 'Anna',
            lastName: 'Nowak',
            price: 120,
          },
        ],
      });
      expect(offersQueryBuilder.orderBy).toHaveBeenCalledWith(
        'user.lastName',
        'ASC',
      );
    });

    it('uses the same bookability rules as slots', async () => {
      offersQueryBuilder.getRawMany.mockResolvedValue([]);

      await service.findBookableEmployees('service-uuid');

      expect(offersQueryBuilder.andWhere).toHaveBeenCalledWith(
        'userService.active = true',
      );
      expect(offersQueryBuilder.andWhere).toHaveBeenCalledWith(
        'user.active = true',
      );
      expect(offersQueryBuilder.innerJoin).toHaveBeenCalledWith(
        expect.anything(),
        'calendar',
        expect.stringContaining('calendar.isDefault = true'),
      );
    });

    it('returns empty list when nobody offers existing service', async () => {
      offersQueryBuilder.getRawMany.mockResolvedValue([]);

      const result = await service.findBookableEmployees('service-uuid');

      expect(result.data.employees).toEqual([]);
    });

    it('throws when service does not exist or is inactive', async () => {
      offersQueryBuilder.getRawMany.mockResolvedValue([]);
      serviceRepository.exists.mockResolvedValue(false);

      await expect(
        service.findBookableEmployees('service-uuid'),
      ).rejects.toBeInstanceOf(ServiceNotFoundException);
    });
  });

  describe('findBookableServices', () => {
    it('returns bookable services with price and duration ranges', async () => {
      offersQueryBuilder.getRawMany.mockResolvedValue([
        {
          uuid: 'service-uuid',
          name: 'Strzyżenie',
          description: 'Strzyżenie damskie',
          minPrice: '80.00',
          maxPrice: '120.00',
          minDuration: 30,
          maxDuration: '45',
        },
      ]);

      const result = await service.findBookableServices();

      expect(result.data).toEqual([
        {
          uuid: 'service-uuid',
          name: 'Strzyżenie',
          description: 'Strzyżenie damskie',
          minPrice: 80,
          maxPrice: 120,
          minDuration: 30,
          maxDuration: 45,
        },
      ]);
      expect(offersQueryBuilder.groupBy).toHaveBeenCalledWith('service.uuid');
    });

    it('does not filter by a single service', async () => {
      offersQueryBuilder.getRawMany.mockResolvedValue([]);

      await service.findBookableServices();

      expect(offersQueryBuilder.andWhere).not.toHaveBeenCalledWith(
        'service.uuid = :serviceId',
        expect.anything(),
      );
      expect(offersQueryBuilder.where).toHaveBeenCalledWith(
        'service.active = true',
      );
    });
  });

  describe('createAppointment', () => {
    const booking = {
      userServiceId: 'anna-service',
      startsAt: '2026-11-02T10:00:00.000Z',
    };

    beforeEach(() => {
      appointmentsService.create.mockResolvedValue({
        statusCode: 201,
        data: {
          uuid: 'appointment-uuid',
          status: AppointmentStatus.PENDING,
          overlaps: [{ uuid: 'internal-event', name: 'Szkolenie' }],
        },
      });
      clientRepository.exists.mockResolvedValue(true);
    });

    it('books as guest with client rules', async () => {
      await service.createAppointment({
        ...booking,
        firstName: 'Jan',
        lastName: 'Kowalski',
        email: 'jan@example.com',
        phone: '500600700',
        note: 'Krótko',
      });

      expect(appointmentsService.create).toHaveBeenCalledWith(
        {
          userServiceId: 'anna-service',
          scheduledAt: '2026-11-02T10:00:00.000Z',
          clientName: 'Jan Kowalski',
          clientEmail: 'jan@example.com',
          clientPhone: '500600700',
          note: 'Krótko',
        },
        { clientUuid: undefined, bookedByClient: true },
      );
    });

    it('does not expose overlapping internal events', async () => {
      const result = await service.createAppointment({
        ...booking,
        firstName: 'Jan',
        email: 'jan@example.com',
      });

      expect(result.data).toEqual({
        uuid: 'appointment-uuid',
        status: AppointmentStatus.PENDING,
      });
    });

    it.each([{ firstName: 'Jan' }, { email: 'jan@example.com' }, {}])(
      'requires guest name and email (%o)',
      async details => {
        await expect(
          service.createAppointment({ ...booking, ...details }),
        ).rejects.toBeInstanceOf(BookingGuestDetailsRequiredException);
        expect(appointmentsService.create).not.toHaveBeenCalled();
      },
    );

    it('books for logged in client without guest details', async () => {
      await service.createAppointment(booking, 'client-uuid');

      expect(clientRepository.exists).toHaveBeenCalledWith({
        where: { uuid: 'client-uuid', active: true, emailVerified: true },
      });
      expect(appointmentsService.create).toHaveBeenCalledWith(
        expect.objectContaining({ clientName: undefined }),
        { clientUuid: 'client-uuid', bookedByClient: true },
      );
    });

    it('rejects inactive or unverified client account', async () => {
      clientRepository.exists.mockResolvedValue(false);

      await expect(
        service.createAppointment(booking, 'client-uuid'),
      ).rejects.toBeInstanceOf(BookingClientAccountUnavailableException);
      expect(appointmentsService.create).not.toHaveBeenCalled();
    });
  });
});
