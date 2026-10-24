import { Salon } from '@/salon/entities/salon.entity';
import { SalonOpeningHours } from '@/salon/entities/salon-opening-hours.entity';
import { SalonSpecialDay } from '@/salon/entities/salon-special-day.entity';
import { TimeRange } from '@/salon/helpers/time.helper';

export type OpeningHoursResponse = Pick<
  SalonOpeningHours,
  'dayOfWeek' | 'opensAt' | 'closesAt'
>;

export type SpecialDayResponse = Pick<
  SalonSpecialDay,
  'uuid' | 'date' | 'name' | 'isClosed'
> & { hours: TimeRange[] };

export type SalonResponse = Pick<
  Salon,
  | 'uuid'
  | 'name'
  | 'email'
  | 'phone'
  | 'timeZone'
  | 'clientMinLeadTimeMinutes'
  | 'maxBookingDaysAhead'
  | 'slotIntervalMinutes'
  | 'clientCancellationDeadlineHours'
  | 'autoConfirmClientBookings'
> & {
  openingHours: OpeningHoursResponse[];
  specialDays: SpecialDayResponse[];
};
