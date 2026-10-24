import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { In, MoreThan } from 'typeorm';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { Role } from '@/roles/entities/role.entity';
import { RefreshToken } from '@/auth/entities/refresh-token.entity';
import { Appointment } from '@/appointment/entities/appointment.entity';
import { AppointmentType } from '@/appointment/enums/appointment-type.enum';
import { AppointmentStatus } from '@/appointment/enums/appointment-status.enum';
import { MailService } from '@/mail/mail.service';
import { UserHasUpcomingAppointmentsException } from '@/users/exceptions/user-has-upcoming-appointments.exception';

const NOW = new Date('2026-11-01T08:00:00.000Z');

describe('UsersService', () => {
  let service: UsersService;

  const createUser = () => ({
    uuid: 'employee-uuid',
    firstName: 'Anna',
    lastName: 'Nowak',
    email: 'anna@hairdresser.pl',
    active: true,
    deleted: false,
  });

  const userRepository = {
    findOneBy: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
    softDelete: jest.fn(),
  };
  const roleRepository = { findOneBy: jest.fn() };
  const refreshTokenRepository = { delete: jest.fn() };
  const appointmentRepository = { count: jest.fn() };

  const editDto = (active: boolean) => ({
    firstName: 'Anna',
    lastName: 'Nowak',
    email: 'anna@hairdresser.pl',
    active,
    role: null,
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    jest.spyOn(Date, 'now').mockReturnValue(NOW.getTime());
    userRepository.findOneBy.mockResolvedValue(createUser());
    userRepository.findOne.mockResolvedValue(createUser());
    appointmentRepository.count.mockResolvedValue(0);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: userRepository },
        { provide: getRepositoryToken(Role), useValue: roleRepository },
        {
          provide: getRepositoryToken(RefreshToken),
          useValue: refreshTokenRepository,
        },
        {
          provide: getRepositoryToken(Appointment),
          useValue: appointmentRepository,
        },
        { provide: MailService, useValue: {} },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('counts only upcoming unfinished client appointments of the employee', async () => {
    await service.update('employee-uuid', editDto(false));

    expect(appointmentRepository.count).toHaveBeenCalledWith({
      where: {
        calendar: { owner: { uuid: 'employee-uuid' } },
        type: AppointmentType.CLIENT,
        status: In([
          AppointmentStatus.PENDING,
          AppointmentStatus.CONFIRMED,
          AppointmentStatus.RESCHEDULED,
        ]),
        deleted: false,
        scheduledEndAt: MoreThan(NOW),
      },
    });
  });

  describe('update', () => {
    it('blocks deactivation of employee with upcoming client appointments', async () => {
      appointmentRepository.count.mockResolvedValue(2);

      await expect(
        service.update('employee-uuid', editDto(false)),
      ).rejects.toThrow(new UserHasUpcomingAppointmentsException(2));
      expect(userRepository.save).not.toHaveBeenCalled();
      expect(refreshTokenRepository.delete).not.toHaveBeenCalled();
    });

    it('deactivates employee without upcoming client appointments', async () => {
      await service.update('employee-uuid', editDto(false));

      expect(refreshTokenRepository.delete).toHaveBeenCalled();
      expect(userRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ active: false }),
      );
    });

    it('does not check appointments when employee stays active', async () => {
      await service.update('employee-uuid', editDto(true));

      expect(appointmentRepository.count).not.toHaveBeenCalled();
      expect(userRepository.save).toHaveBeenCalled();
    });

    it('does not check appointments when employee is already inactive', async () => {
      userRepository.findOneBy.mockResolvedValue({
        ...createUser(),
        active: false,
      });

      await service.update('employee-uuid', editDto(false));

      expect(appointmentRepository.count).not.toHaveBeenCalled();
    });
  });

  describe('softDelete', () => {
    it('blocks soft delete of employee with upcoming client appointments', async () => {
      appointmentRepository.count.mockResolvedValue(1);

      await expect(service.softDelete('employee-uuid')).rejects.toBeInstanceOf(
        UserHasUpcomingAppointmentsException,
      );
      expect(userRepository.save).not.toHaveBeenCalled();
      expect(userRepository.softDelete).not.toHaveBeenCalled();
    });

    it('soft deletes employee without upcoming client appointments', async () => {
      await service.softDelete('employee-uuid');

      expect(userRepository.softDelete).toHaveBeenCalledWith({
        uuid: 'employee-uuid',
      });
    });
  });

  describe('remove', () => {
    it('blocks hard delete that would cascade to client appointments', async () => {
      appointmentRepository.count.mockResolvedValue(3);

      await expect(service.remove('employee-uuid')).rejects.toBeInstanceOf(
        UserHasUpcomingAppointmentsException,
      );
      expect(userRepository.remove).not.toHaveBeenCalled();
    });

    it('removes employee without upcoming client appointments', async () => {
      await service.remove('employee-uuid');

      expect(userRepository.remove).toHaveBeenCalled();
    });
  });
});
