import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { In, MoreThan } from 'typeorm';
import { ServicesService } from './services.service';
import { Service } from '@/services/entities/service.entity';
import { Appointment } from '@/appointment/entities/appointment.entity';
import { AppointmentType } from '@/appointment/enums/appointment-type.enum';
import { UNFINISHED_APPOINTMENT_STATUSES } from '@/appointment/helpers/upcoming-client-appointments.helper';
import { ServiceHasUpcomingAppointmentsException } from '@/services/exceptions/service-has-upcoming-appointments.exception';

const NOW = new Date('2026-11-01T08:00:00.000Z');

describe('ServicesService', () => {
  let service: ServicesService;

  const createService = () => ({
    uuid: 'service-uuid',
    name: 'Strzyżenie',
    description: 'Strzyżenie damskie',
    active: true,
    deleted: false,
  });

  const serviceRepository = {
    findOneBy: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
    softDelete: jest.fn(),
  };
  const appointmentRepository = { count: jest.fn() };

  const editDto = (active: boolean) => ({
    name: 'Strzyżenie',
    description: 'Strzyżenie damskie',
    active,
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    jest.spyOn(Date, 'now').mockReturnValue(NOW.getTime());
    serviceRepository.findOneBy.mockResolvedValue(createService());
    serviceRepository.findOne.mockResolvedValue(createService());
    appointmentRepository.count.mockResolvedValue(0);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServicesService,
        { provide: getRepositoryToken(Service), useValue: serviceRepository },
        {
          provide: getRepositoryToken(Appointment),
          useValue: appointmentRepository,
        },
      ],
    }).compile();

    service = module.get<ServicesService>(ServicesService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('counts upcoming client appointments of the service', async () => {
    await service.update('service-uuid', editDto(false));

    expect(appointmentRepository.count).toHaveBeenCalledWith({
      where: {
        userService: { service: { uuid: 'service-uuid' } },
        type: AppointmentType.CLIENT,
        status: In(UNFINISHED_APPOINTMENT_STATUSES),
        deleted: false,
        scheduledEndAt: MoreThan(NOW),
      },
    });
  });

  it('blocks deactivation of service with upcoming client appointments', async () => {
    appointmentRepository.count.mockResolvedValue(4);

    await expect(
      service.update('service-uuid', editDto(false)),
    ).rejects.toThrow(new ServiceHasUpcomingAppointmentsException(4));
    expect(serviceRepository.save).not.toHaveBeenCalled();
  });

  it('allows editing active service without checking appointments', async () => {
    await service.update('service-uuid', editDto(true));

    expect(appointmentRepository.count).not.toHaveBeenCalled();
    expect(serviceRepository.save).toHaveBeenCalled();
  });

  it('blocks soft delete of service with upcoming client appointments', async () => {
    appointmentRepository.count.mockResolvedValue(1);

    await expect(service.softDelete('service-uuid')).rejects.toBeInstanceOf(
      ServiceHasUpcomingAppointmentsException,
    );
    expect(serviceRepository.softDelete).not.toHaveBeenCalled();
  });

  it('blocks hard delete of service with upcoming client appointments', async () => {
    appointmentRepository.count.mockResolvedValue(1);

    await expect(service.remove('service-uuid')).rejects.toBeInstanceOf(
      ServiceHasUpcomingAppointmentsException,
    );
    expect(serviceRepository.remove).not.toHaveBeenCalled();
  });

  it('deletes service without upcoming client appointments', async () => {
    await service.softDelete('service-uuid');
    await service.remove('service-uuid');

    expect(serviceRepository.softDelete).toHaveBeenCalled();
    expect(serviceRepository.remove).toHaveBeenCalled();
  });
});
