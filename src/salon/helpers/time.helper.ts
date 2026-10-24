import { TZDate } from '@date-fns/tz';
import { ValueTransformer } from 'typeorm';

export const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export interface TimeRange {
  opensAt: string;
  closesAt: string;
}

// MySQL returns TIME columns as HH:mm:ss, the API works with HH:mm
export const timeColumnTransformer: ValueTransformer = {
  to: (value: string) => value,
  from: (value: string | null) => (value ? value.slice(0, 5) : value),
};

export const toMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

export const sortTimeRanges = <T extends TimeRange>(ranges: T[]): T[] =>
  [...ranges].sort((a, b) => toMinutes(a.opensAt) - toMinutes(b.opensAt));

export const findTimeRangeError = (ranges: TimeRange[]): string | null => {
  const sorted = sortTimeRanges(ranges);

  for (let i = 0; i < sorted.length; i++) {
    const { opensAt, closesAt } = sorted[i];

    if (toMinutes(opensAt) >= toMinutes(closesAt)) {
      return `Godzina otwarcia ${opensAt} musi być wcześniejsza niż godzina zamknięcia ${closesAt}`;
    }

    const next = sorted[i + 1];
    if (next && toMinutes(next.opensAt) < toMinutes(closesAt)) {
      return `Przedziały ${opensAt}-${closesAt} i ${next.opensAt}-${next.closesAt} nachodzą na siebie`;
    }
  }

  return null;
};

export const formatLocalDate = (date: Date, timeZone: string): string =>
  new Intl.DateTimeFormat('en-CA', { timeZone }).format(date);

export interface LocalDateTime {
  date: string;
  minutes: number;
}

export const toLocalDateTime = (
  date: Date,
  timeZone: string,
): LocalDateTime => {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(date)
      .map(({ type, value }) => [type, value]),
  );

  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    minutes: Number(parts.hour) * 60 + Number(parts.minute),
  };
};

export const isoDayOfWeek = (date: string): number =>
  new Date(`${date}T00:00:00.000Z`).getUTCDay() || 7;

export const toTime = (minutes: number): string =>
  `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;

export const addDays = (date: string, days: number): string =>
  new Date(Date.parse(`${date}T00:00:00.000Z`) + days * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

export const fromLocalDateTime = (
  date: string,
  minutes: number,
  timeZone: string,
): Date => {
  const [year, month, day] = date.split('-').map(Number);

  return new Date(
    new TZDate(
      year,
      month - 1,
      day,
      Math.floor(minutes / 60),
      minutes % 60,
      timeZone,
    ).getTime(),
  );
};
