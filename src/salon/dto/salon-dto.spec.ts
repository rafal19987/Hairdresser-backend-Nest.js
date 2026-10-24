import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UpdateSalonDto } from '@/salon/dto/update-salon.dto';
import { ReplaceOpeningHoursDto } from '@/salon/dto/replace-opening-hours.dto';
import { SaveSpecialDayDto } from '@/salon/dto/save-special-day.dto';

const errorsOf = async <T extends object>(cls: new () => T, plain: object) =>
  validate(plainToInstance(cls, plain));

describe('salon DTOs', () => {
  it('accepts valid salon update', async () => {
    expect(
      await errorsOf(UpdateSalonDto, {
        timeZone: 'Europe/Warsaw',
        slotIntervalMinutes: 15,
        email: 'kontakt@reve.pl',
      }),
    ).toHaveLength(0);
  });

  it('rejects unknown time zone', async () => {
    const errors = await errorsOf(UpdateSalonDto, {
      timeZone: 'Europe/Nowhere',
    });

    expect(errors[0].property).toBe('timeZone');
  });

  it('rejects unsupported slot interval', async () => {
    const errors = await errorsOf(UpdateSalonDto, { slotIntervalMinutes: 7 });

    expect(errors[0].property).toBe('slotIntervalMinutes');
  });

  it.each(['9:00', '24:00', '09:60', '0900'])(
    'rejects invalid time %s',
    async opensAt => {
      const errors = await errorsOf(ReplaceOpeningHoursDto, {
        hours: [{ dayOfWeek: 1, opensAt, closesAt: '18:00' }],
      });

      expect(errors).toHaveLength(1);
    },
  );

  it.each([0, 8])('rejects day of week %s', async dayOfWeek => {
    const errors = await errorsOf(ReplaceOpeningHoursDto, {
      hours: [{ dayOfWeek, opensAt: '09:00', closesAt: '18:00' }],
    });

    expect(errors).toHaveLength(1);
  });

  it('accepts valid special day', async () => {
    expect(
      await errorsOf(SaveSpecialDayDto, {
        date: '2026-12-24',
        isClosed: false,
        hours: [{ opensAt: '09:00', closesAt: '13:00' }],
      }),
    ).toHaveLength(0);
  });

  it.each(['2026-02-30', '2026-12-24T00:00:00Z', '24.12.2026'])(
    'rejects invalid special day date %s',
    async date => {
      const errors = await errorsOf(SaveSpecialDayDto, {
        date,
        isClosed: true,
      });

      expect(errors[0].property).toBe('date');
    },
  );
});
