import { Salon } from '@/salon/entities/salon.entity';
import { SalonOpeningHours } from '@/salon/entities/salon-opening-hours.entity';
import { SalonSpecialDay } from '@/salon/entities/salon-special-day.entity';
import {
  OpeningHoursResponse,
  SalonResponse,
  SpecialDayResponse,
} from '@/salon/interfaces/salon-response.interface';
import { sortTimeRanges } from '@/salon/helpers/time.helper';

export const toOpeningHoursResponse = (
  openingHours: SalonOpeningHours[],
): OpeningHoursResponse[] =>
  sortTimeRanges(openingHours)
    .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
    .map(({ dayOfWeek, opensAt, closesAt }) => ({
      dayOfWeek,
      opensAt,
      closesAt,
    }));

export const toSpecialDayResponse = (
  specialDay: SalonSpecialDay,
): SpecialDayResponse => ({
  uuid: specialDay.uuid,
  date: specialDay.date,
  name: specialDay.name,
  isClosed: specialDay.isClosed,
  hours: sortTimeRanges(specialDay.hours ?? []).map(
    ({ opensAt, closesAt }) => ({ opensAt, closesAt }),
  ),
});

export const toSalonResponse = (
  salon: Salon,
  openingHours: SalonOpeningHours[],
  specialDays: SalonSpecialDay[],
): SalonResponse => ({
  uuid: salon.uuid,
  name: salon.name,
  email: salon.email,
  phone: salon.phone,
  timeZone: salon.timeZone,
  clientMinLeadTimeMinutes: salon.clientMinLeadTimeMinutes,
  maxBookingDaysAhead: salon.maxBookingDaysAhead,
  slotIntervalMinutes: salon.slotIntervalMinutes,
  clientCancellationDeadlineHours: salon.clientCancellationDeadlineHours,
  autoConfirmClientBookings: salon.autoConfirmClientBookings,
  openingHours: toOpeningHoursResponse(openingHours),
  specialDays: specialDays.map(toSpecialDayResponse),
});
