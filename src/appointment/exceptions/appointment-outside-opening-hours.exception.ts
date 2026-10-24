import { BadRequestException } from '@nestjs/common';
import { TimeRange } from '@/salon/helpers/time.helper';

export class AppointmentOutsideOpeningHoursException extends BadRequestException {
  constructor(date: string, openingRanges: TimeRange[]) {
    super(
      openingRanges.length === 0
        ? `Salon jest zamknięty w dniu ${date}`
        : `Wizyta musi mieścić się w godzinach otwarcia salonu w dniu ${date}: ${openingRanges
            .map(({ opensAt, closesAt }) => `${opensAt}-${closesAt}`)
            .join(', ')}`,
    );
  }
}
