import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { SalonService } from '@/salon/salon.service';
import { Salon } from '@/salon/entities/salon.entity';
import { SalonOpeningHours } from '@/salon/entities/salon-opening-hours.entity';
import { SalonSpecialDay } from '@/salon/entities/salon-special-day.entity';
import { SalonNotFoundException } from '@/salon/exceptions/salon-not-found.exception';
import { SalonInvalidHoursException } from '@/salon/exceptions/salon-invalid-hours.exception';
import { SalonSpecialDayNotFoundException } from '@/salon/exceptions/salon-special-day-not-found.exception';
import { SalonSpecialDayAlreadyExistsException } from '@/salon/exceptions/salon-special-day-already-exists.exception';

const NOW = new Date('2026-12-31T23:30:00.000Z');

describe('SalonService', () => {
  let service: SalonService;

  const salon = {
    uuid: 'salon-uuid',
    name: 'Rêve',
    email: null,
    phone: null,
    timeZone: 'Europe/Warsaw',
    clientMinLeadTimeMinutes: 60,
    maxBookingDaysAhead: 60,
    slotIntervalMinutes: 15,
    clientCancellationDeadlineHours: 24,
    autoConfirmClientBookings: false,
  } as Salon;

  const specialDayQueryBuilder = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
  };

  const salonRepository = {
    find: jest.fn(),
    save: jest.fn(),
  };

  const openingHoursRepository = {
    find: jest.fn(),
  };

  const specialDayRepository = {
    createQueryBuilder: jest.fn(() => specialDayQueryBuilder),
    findOne: jest.fn(),
    exists: jest.fn(),
    create: jest.fn(value => value),
    save: jest.fn(value => Promise.resolve({ uuid: 'day-uuid', ...value })),
    remove: jest.fn(),
  };

  const transactionOpeningHoursRepository = {
    delete: jest.fn(),
    create: jest.fn(value => value),
    save: jest.fn(value => Promise.resolve(value)),
  };

  const dataSource = {
    transaction: jest.fn(callback =>
      callback({ getRepository: () => transactionOpeningHoursRepository }),
    ),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    jest.spyOn(Date, 'now').mockReturnValue(NOW.getTime());

    salonRepository.find.mockResolvedValue([salon]);
    salonRepository.save.mockImplementation(value => Promise.resolve(value));
    openingHoursRepository.find.mockResolvedValue([]);
    specialDayQueryBuilder.getMany.mockResolvedValue([]);
    specialDayRepository.exists.mockResolvedValue(false);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SalonService,
        { provide: getRepositoryToken(Salon), useValue: salonRepository },
        {
          provide: getRepositoryToken(SalonOpeningHours),
          useValue: openingHoursRepository,
        },
        {
          provide: getRepositoryToken(SalonSpecialDay),
          useValue: specialDayRepository,
        },
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();

    service = module.get<SalonService>(SalonService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getSalon', () => {
    it('throws when salon is not configured', async () => {
      salonRepository.find.mockResolvedValue([]);

      await expect(service.getSalon()).rejects.toThrow(SalonNotFoundException);
    });

    it('returns opening hours sorted by day and time', async () => {
      openingHoursRepository.find.mockResolvedValue([
        { dayOfWeek: 2, opensAt: '09:00', closesAt: '18:00' },
        { dayOfWeek: 1, opensAt: '14:00', closesAt: '18:00' },
        { dayOfWeek: 1, opensAt: '09:00', closesAt: '13:00' },
      ]);

      const result = await service.getSalon();

      expect(result.data.openingHours).toEqual([
        { dayOfWeek: 1, opensAt: '09:00', closesAt: '13:00' },
        { dayOfWeek: 1, opensAt: '14:00', closesAt: '18:00' },
        { dayOfWeek: 2, opensAt: '09:00', closesAt: '18:00' },
      ]);
      expect(result.data).not.toHaveProperty('createdAt');
    });

    it('returns special days from today in salon time zone', async () => {
      await service.getSalon();

      expect(specialDayQueryBuilder.andWhere).toHaveBeenCalledWith(
        'specialDay.date >= :from',
        { from: '2027-01-01' },
      );
    });
  });

  describe('update', () => {
    it('updates only provided fields', async () => {
      await service.update({ name: 'Nowa nazwa', slotIntervalMinutes: 30 });

      expect(salonRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Nowa nazwa',
          slotIntervalMinutes: 30,
          timeZone: 'Europe/Warsaw',
        }),
      );
    });

    it('ignores undefined fields', async () => {
      await service.update({ name: undefined, phone: '123' });

      expect(salonRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Rêve', phone: '123' }),
      );
    });
  });

  describe('replaceOpeningHours', () => {
    it('replaces the whole week in a transaction', async () => {
      const hours = [
        { dayOfWeek: 1, opensAt: '09:00', closesAt: '13:00' },
        { dayOfWeek: 1, opensAt: '14:00', closesAt: '18:00' },
      ];

      const result = await service.replaceOpeningHours({ hours });

      expect(transactionOpeningHoursRepository.delete).toHaveBeenCalledWith({
        salon: { uuid: 'salon-uuid' },
      });
      expect(transactionOpeningHoursRepository.save).toHaveBeenCalledWith(
        hours.map(entry => ({ ...entry, salon })),
      );
      expect(result.data).toEqual(hours);
    });

    it('allows closing the salon for the whole week', async () => {
      await service.replaceOpeningHours({ hours: [] });

      expect(transactionOpeningHoursRepository.delete).toHaveBeenCalled();
      expect(transactionOpeningHoursRepository.save).toHaveBeenCalledWith([]);
    });

    it('rejects overlapping ranges on the same day', async () => {
      await expect(
        service.replaceOpeningHours({
          hours: [
            { dayOfWeek: 3, opensAt: '09:00', closesAt: '14:00' },
            { dayOfWeek: 3, opensAt: '13:00', closesAt: '18:00' },
          ],
        }),
      ).rejects.toThrow(/^środa: /);
      expect(dataSource.transaction).not.toHaveBeenCalled();
    });

    it('allows the same hours on different days', async () => {
      await expect(
        service.replaceOpeningHours({
          hours: [
            { dayOfWeek: 1, opensAt: '09:00', closesAt: '18:00' },
            { dayOfWeek: 2, opensAt: '09:00', closesAt: '18:00' },
          ],
        }),
      ).resolves.toBeDefined();
    });
  });

  describe('findSpecialDays', () => {
    it('filters by provided range', async () => {
      await service.findSpecialDays({ from: '2026-12-01', to: '2026-12-31' });

      expect(specialDayQueryBuilder.andWhere).toHaveBeenCalledWith(
        'specialDay.date >= :from',
        { from: '2026-12-01' },
      );
      expect(specialDayQueryBuilder.andWhere).toHaveBeenCalledWith(
        'specialDay.date <= :to',
        { to: '2026-12-31' },
      );
    });

    it('rejects range ending before it starts', async () => {
      await expect(
        service.findSpecialDays({ from: '2026-12-31', to: '2026-12-01' }),
      ).rejects.toThrow(SalonInvalidHoursException);
    });
  });

  describe('createSpecialDay', () => {
    it('creates closed day', async () => {
      const result = await service.createSpecialDay({
        date: '2026-12-25',
        name: 'Boże Narodzenie',
        isClosed: true,
      });

      expect(specialDayRepository.save).toHaveBeenCalledWith({
        salon,
        date: '2026-12-25',
        name: 'Boże Narodzenie',
        isClosed: true,
        hours: [],
      });
      expect(result.data).toEqual({
        uuid: 'day-uuid',
        date: '2026-12-25',
        name: 'Boże Narodzenie',
        isClosed: true,
        hours: [],
      });
    });

    it('creates day with special hours', async () => {
      const result = await service.createSpecialDay({
        date: '2026-12-24',
        isClosed: false,
        hours: [{ opensAt: '09:00', closesAt: '13:00' }],
      });

      expect(result.data.hours).toEqual([
        { opensAt: '09:00', closesAt: '13:00' },
      ]);
      expect(result.data.name).toBeNull();
    });

    it('rejects closed day with hours', async () => {
      await expect(
        service.createSpecialDay({
          date: '2026-12-25',
          isClosed: true,
          hours: [{ opensAt: '09:00', closesAt: '13:00' }],
        }),
      ).rejects.toThrow(SalonInvalidHoursException);
    });

    it('rejects open day without hours', async () => {
      await expect(
        service.createSpecialDay({ date: '2026-12-24', isClosed: false }),
      ).rejects.toThrow(SalonInvalidHoursException);
    });

    it('rejects invalid hours', async () => {
      await expect(
        service.createSpecialDay({
          date: '2026-12-24',
          isClosed: false,
          hours: [{ opensAt: '13:00', closesAt: '09:00' }],
        }),
      ).rejects.toThrow(SalonInvalidHoursException);
    });

    it('rejects duplicated date', async () => {
      specialDayRepository.exists.mockResolvedValue(true);

      await expect(
        service.createSpecialDay({ date: '2026-12-25', isClosed: true }),
      ).rejects.toThrow(SalonSpecialDayAlreadyExistsException);
      expect(specialDayRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('updateSpecialDay', () => {
    const existing = () => ({
      uuid: 'day-uuid',
      date: '2026-12-24',
      name: 'Wigilia',
      isClosed: false,
      hours: [{ opensAt: '09:00', closesAt: '13:00' }],
    });

    it('throws when special day does not exist', async () => {
      specialDayRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updateSpecialDay('day-uuid', {
          date: '2026-12-24',
          isClosed: true,
        }),
      ).rejects.toThrow(SalonSpecialDayNotFoundException);
    });

    it('replaces hours and keeps date check when date is unchanged', async () => {
      specialDayRepository.findOne.mockResolvedValue(existing());

      const result = await service.updateSpecialDay('day-uuid', {
        date: '2026-12-24',
        name: 'Wigilia',
        isClosed: true,
      });

      expect(specialDayRepository.exists).not.toHaveBeenCalled();
      expect(result.data).toEqual(
        expect.objectContaining({ isClosed: true, hours: [] }),
      );
    });

    it('rejects moving to a date that already has a special day', async () => {
      specialDayRepository.findOne.mockResolvedValue(existing());
      specialDayRepository.exists.mockResolvedValue(true);

      await expect(
        service.updateSpecialDay('day-uuid', {
          date: '2026-12-31',
          isClosed: true,
        }),
      ).rejects.toThrow(SalonSpecialDayAlreadyExistsException);
    });
  });

  describe('removeSpecialDay', () => {
    it('removes special day of the salon', async () => {
      const specialDay = { uuid: 'day-uuid' };
      specialDayRepository.findOne.mockResolvedValue(specialDay);

      await service.removeSpecialDay('day-uuid');

      expect(specialDayRepository.findOne).toHaveBeenCalledWith({
        where: { uuid: 'day-uuid', salon: { uuid: 'salon-uuid' } },
        relations: { hours: true },
      });
      expect(specialDayRepository.remove).toHaveBeenCalledWith(specialDay);
    });
  });
});
