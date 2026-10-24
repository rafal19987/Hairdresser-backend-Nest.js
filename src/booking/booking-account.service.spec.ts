import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BookingAccountService } from '@/booking/booking-account.service';
import { Client } from '@/clients/entities/client.entity';
import { BOOKING_MANAGE_SERVICE } from '@/booking/interfaces/booking-manage-service.interface';
import { BookingClientAccountUnavailableException } from '@/booking/exceptions/booking-client-account-unavailable.exception';

describe('BookingAccountService', () => {
  let service: BookingAccountService;

  const client = {
    uuid: 'client-uuid',
    email: 'ewa@example.com',
    password: 'hash',
    firstName: 'Ewa',
    lastName: 'Nowak',
    phone: null,
    marketingConsent: false,
    notes: 'Notatka salonu',
  };

  const clientRepository = { findOneBy: jest.fn(), save: jest.fn() };
  const bookingManageService = {
    findAppointments: jest.fn(),
    cancelAppointment: jest.fn(),
    rescheduleAppointment: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    clientRepository.findOneBy.mockResolvedValue({ ...client });
    clientRepository.save.mockImplementation(async value => value);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingAccountService,
        { provide: getRepositoryToken(Client), useValue: clientRepository },
        { provide: BOOKING_MANAGE_SERVICE, useValue: bookingManageService },
      ],
    }).compile();

    service = module.get<BookingAccountService>(BookingAccountService);
  });

  it('returns profile without password and salon notes', async () => {
    const result = await service.getProfile('client-uuid');

    expect(result.data).toEqual({
      uuid: 'client-uuid',
      email: 'ewa@example.com',
      firstName: 'Ewa',
      lastName: 'Nowak',
      phone: null,
      marketingConsent: false,
    });
    expect(clientRepository.findOneBy).toHaveBeenCalledWith({
      uuid: 'client-uuid',
      active: true,
      emailVerified: true,
    });
  });

  it('updates only provided profile fields', async () => {
    const result = await service.updateProfile('client-uuid', {
      phone: '500600700',
      firstName: undefined,
    });

    expect(clientRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ firstName: 'Ewa', phone: '500600700' }),
    );
    expect(result.data.phone).toBe('500600700');
  });

  it('rejects inactive or unverified account', async () => {
    clientRepository.findOneBy.mockResolvedValue(null);

    await expect(
      service.findAppointments('client-uuid'),
    ).rejects.toBeInstanceOf(BookingClientAccountUnavailableException);
    expect(bookingManageService.findAppointments).not.toHaveBeenCalled();
  });

  it('uses account email for appointments', async () => {
    await service.findAppointments('client-uuid');
    await service.cancelAppointment('client-uuid', 'appointment-uuid', {});
    await service.rescheduleAppointment('client-uuid', 'appointment-uuid', {
      startsAt: '2026-11-04T09:00:00.000Z',
    });

    expect(bookingManageService.findAppointments).toHaveBeenCalledWith(
      'ewa@example.com',
    );
    expect(bookingManageService.cancelAppointment).toHaveBeenCalledWith(
      'ewa@example.com',
      'appointment-uuid',
      {},
    );
    expect(bookingManageService.rescheduleAppointment).toHaveBeenCalledWith(
      'ewa@example.com',
      'appointment-uuid',
      { startsAt: '2026-11-04T09:00:00.000Z' },
    );
  });
});
