import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateAppointmentDto } from '@/appointment/dto/create-appointment.dto';

const validateScheduledAt = async (scheduledAt: string) => {
  const dto = plainToInstance(CreateAppointmentDto, {
    userServiceId: '7b1f6c1e-1111-4a2b-9c3d-000000000001',
    scheduledAt,
  });
  const errors = await validate(dto);
  return errors.filter(error => error.property === 'scheduledAt');
};

describe('HasTimeZone', () => {
  it.each([
    '2026-03-01T10:00:00.000Z',
    '2026-03-01T10:00:00Z',
    '2026-03-01T11:00:00+01:00',
    '2026-03-01T05:00:00-05:00',
  ])('accepts date with time zone %s', async value => {
    expect(await validateScheduledAt(value)).toHaveLength(0);
  });

  it.each(['2026-03-01T10:00:00', '2026-03-01T10:00:00.000', '2026-03-01'])(
    'rejects date without time zone %s',
    async value => {
      const errors = await validateScheduledAt(value);

      expect(errors).toHaveLength(1);
      expect(errors[0].constraints).toHaveProperty('matches');
    },
  );
});
