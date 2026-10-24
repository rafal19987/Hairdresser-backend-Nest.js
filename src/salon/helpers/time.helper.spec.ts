import {
  addDays,
  findTimeRangeError,
  fromLocalDateTime,
  formatLocalDate,
  isoDayOfWeek,
  timeColumnTransformer,
  toLocalDateTime,
  toMinutes,
  toTime,
} from '@/salon/helpers/time.helper';

describe('time helper', () => {
  it('converts time to minutes', () => {
    expect(toMinutes('00:00')).toBe(0);
    expect(toMinutes('09:30')).toBe(570);
    expect(toMinutes('23:59')).toBe(1439);
  });

  it('strips seconds from database time', () => {
    expect(timeColumnTransformer.from('09:00:00')).toBe('09:00');
  });

  it('accepts separate ranges regardless of order', () => {
    expect(
      findTimeRangeError([
        { opensAt: '14:00', closesAt: '18:00' },
        { opensAt: '09:00', closesAt: '13:00' },
      ]),
    ).toBeNull();
  });

  it('accepts adjacent ranges', () => {
    expect(
      findTimeRangeError([
        { opensAt: '09:00', closesAt: '13:00' },
        { opensAt: '13:00', closesAt: '18:00' },
      ]),
    ).toBeNull();
  });

  it('rejects range closing before opening', () => {
    expect(
      findTimeRangeError([{ opensAt: '18:00', closesAt: '09:00' }]),
    ).toContain('musi być wcześniejsza');
  });

  it('rejects empty range', () => {
    expect(
      findTimeRangeError([{ opensAt: '09:00', closesAt: '09:00' }]),
    ).not.toBeNull();
  });

  it('rejects overlapping ranges', () => {
    expect(
      findTimeRangeError([
        { opensAt: '12:00', closesAt: '18:00' },
        { opensAt: '09:00', closesAt: '13:00' },
      ]),
    ).toContain('nachodzą na siebie');
  });

  it('formats date in given time zone', () => {
    const lateEveningUtc = new Date('2026-12-31T23:30:00.000Z');

    expect(formatLocalDate(lateEveningUtc, 'UTC')).toBe('2026-12-31');
    expect(formatLocalDate(lateEveningUtc, 'Europe/Warsaw')).toBe('2027-01-01');
  });

  it('converts UTC date to salon local date and minutes', () => {
    expect(
      toLocalDateTime(new Date('2026-11-02T10:15:00.000Z'), 'Europe/Warsaw'),
    ).toEqual({ date: '2026-11-02', minutes: 11 * 60 + 15 });
    expect(
      toLocalDateTime(new Date('2026-07-01T22:30:00.000Z'), 'Europe/Warsaw'),
    ).toEqual({ date: '2026-07-02', minutes: 30 });
  });

  it('returns midnight as zero minutes', () => {
    expect(
      toLocalDateTime(new Date('2026-11-01T23:00:00.000Z'), 'Europe/Warsaw')
        .minutes,
    ).toBe(0);
  });

  it('returns ISO day of week', () => {
    expect(isoDayOfWeek('2026-11-02')).toBe(1);
    expect(isoDayOfWeek('2026-11-08')).toBe(7);
  });

  it('formats minutes as time', () => {
    expect(toTime(0)).toBe('00:00');
    expect(toTime(9 * 60 + 5)).toBe('09:05');
  });

  it('adds days across month and year boundaries', () => {
    expect(addDays('2026-11-30', 1)).toBe('2026-12-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
  });

  it('converts salon local time to UTC with daylight saving time', () => {
    expect(
      fromLocalDateTime('2026-11-02', 9 * 60, 'Europe/Warsaw').toISOString(),
    ).toBe('2026-11-02T08:00:00.000Z');
    expect(
      fromLocalDateTime('2026-07-01', 9 * 60, 'Europe/Warsaw').toISOString(),
    ).toBe('2026-07-01T07:00:00.000Z');
  });

  it('converts local midnight on the day of time change', () => {
    // Clocks go back on 2026-10-25, so that day lasts 25 hours
    const start = fromLocalDateTime('2026-10-25', 0, 'Europe/Warsaw');
    const end = fromLocalDateTime('2026-10-26', 0, 'Europe/Warsaw');

    expect(end.getTime() - start.getTime()).toBe(25 * 60 * 60 * 1000);
  });
});
