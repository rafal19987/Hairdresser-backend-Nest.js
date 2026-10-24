import { BadRequestException } from '@nestjs/common';

export class AppointmentBeyondBookingHorizonException extends BadRequestException {
  constructor(maxBookingDaysAhead: number) {
    super(
      `Wizytę można zarezerwować maksymalnie ${maxBookingDaysAhead} dni naprzód`,
    );
  }
}
