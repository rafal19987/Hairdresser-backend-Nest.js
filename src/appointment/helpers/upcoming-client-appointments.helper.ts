import { FindOptionsWhere, In, MoreThan, Repository } from 'typeorm';
import { Appointment } from '@/appointment/entities/appointment.entity';
import { AppointmentType } from '@/appointment/enums/appointment-type.enum';
import { AppointmentStatus } from '@/appointment/enums/appointment-status.enum';

export const UNFINISHED_APPOINTMENT_STATUSES = [
  AppointmentStatus.PENDING,
  AppointmentStatus.CONFIRMED,
  AppointmentStatus.RESCHEDULED,
];

export const countUpcomingClientAppointments = (
  repository: Repository<Appointment>,
  where: FindOptionsWhere<Appointment>,
): Promise<number> =>
  repository.count({
    where: {
      ...where,
      type: AppointmentType.CLIENT,
      status: In(UNFINISHED_APPOINTMENT_STATUSES),
      deleted: false,
      scheduledEndAt: MoreThan(new Date(Date.now())),
    },
  });
