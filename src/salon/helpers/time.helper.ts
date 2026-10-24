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
