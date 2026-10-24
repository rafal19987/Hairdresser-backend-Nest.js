import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UsersServicesService } from './users-services.service';
import { UsersServices } from '@/users-services/entities/users-services.entity';
import { User } from '@/users/entities/user.entity';
import { Service } from '@/services/entities/service.entity';
import { Appointment } from '@/appointment/entities/appointment.entity';
import { UsersServicesHasUpcomingAppointmentsException } from '@/users-services/exceptions/users-services-has-upcoming-appointments.exception';

describe('UsersServicesService', () => {
  let service: UsersServicesService;

  const userServiceRepository = {
    findOneBy: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };
  const appointmentRepository = { count: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    userServiceRepository.findOneBy.mockResolvedValue({
      uuid: 'user-service-uuid',
      price: 100,
      duration: 60,
      active: true,
    });
    appointmentRepository.count.mockResolvedValue(0);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersServicesService,
        {
          provide: getRepositoryToken(UsersServices),
          useValue: userServiceRepository,
        },
        { provide: getRepositoryToken(User), useValue: {} },
        { provide: getRepositoryToken(Service), useValue: {} },
        {
          provide: getRepositoryToken(Appointment),
          useValue: appointmentRepository,
        },
      ],
    }).compile();

    service = module.get<UsersServicesService>(UsersServicesService);
  });

  it('blocks deactivation of assignment with upcoming client appointments', async () => {
    appointmentRepository.count.mockResolvedValue(2);

    await expect(
      service.update('user-service-uuid', { active: false }),
    ).rejects.toThrow(new UsersServicesHasUpcomingAppointmentsException(2));
    expect(appointmentRepository.count).toHaveBeenCalledWith({
      where: expect.objectContaining({
        userService: { uuid: 'user-service-uuid' },
      }),
    });
    expect(userServiceRepository.save).not.toHaveBeenCalled();
  });

  it('allows price change without checking appointments', async () => {
    await service.update('user-service-uuid', { price: 120 });

    expect(appointmentRepository.count).not.toHaveBeenCalled();
    expect(userServiceRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ price: 120 }),
    );
  });

  it('deactivates assignment without upcoming client appointments', async () => {
    await service.update('user-service-uuid', { active: false });

    expect(userServiceRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ active: false }),
    );
  });

  it('blocks removing assignment with upcoming client appointments', async () => {
    appointmentRepository.count.mockResolvedValue(1);

    await expect(service.remove('user-service-uuid')).rejects.toBeInstanceOf(
      UsersServicesHasUpcomingAppointmentsException,
    );
    expect(userServiceRepository.remove).not.toHaveBeenCalled();
  });

  it('removes assignment without upcoming client appointments', async () => {
    await service.remove('user-service-uuid');

    expect(userServiceRepository.remove).toHaveBeenCalled();
  });
});
