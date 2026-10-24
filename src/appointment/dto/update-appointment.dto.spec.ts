import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UpdateAppointmentDto } from './update-appointment.dto';
import { AppointmentStatus } from '@/appointment/enums/appointment-status.enum';

const validateStatus = async (status: string) => {
  const dto = plainToInstance(UpdateAppointmentDto, { status });
  const errors = await validate(dto);
  return errors.filter(error => error.property === 'status');
};

describe('UpdateAppointmentDto', () => {
  it.each([
    AppointmentStatus.PENDING,
    AppointmentStatus.CONFIRMED,
    AppointmentStatus.COMPLETED,
  ])('accepts status %s', async status => {
    expect(await validateStatus(status)).toHaveLength(0);
  });

  it.each([AppointmentStatus.CANCELLED, AppointmentStatus.RESCHEDULED])(
    'rejects status %s handled by dedicated endpoint',
    async status => {
      const errors = await validateStatus(status);

      expect(errors).toHaveLength(1);
      expect(Object.values(errors[0].constraints!)[0]).toContain(
        'osobne endpointy',
      );
    },
  );
});
