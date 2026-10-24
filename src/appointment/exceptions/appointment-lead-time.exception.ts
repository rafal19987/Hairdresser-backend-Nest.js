import { BadRequestException } from '@nestjs/common';
import { CLIENT_BOOKING_MIN_LEAD_TIME_MINUTES } from '@/appointment/constants';

export class AppointmentLeadTimeException extends BadRequestException {
  constructor(message?: string) {
    super(
      message ||
        `Wizytę można zarezerwować najpóźniej ${CLIENT_BOOKING_MIN_LEAD_TIME_MINUTES} minut przed jej rozpoczęciem`,
    );
  }
}
