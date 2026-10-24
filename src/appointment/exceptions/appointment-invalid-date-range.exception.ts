import { BadRequestException } from '@nestjs/common';

export class AppointmentInvalidDateRangeException extends BadRequestException {
  constructor(message?: string) {
    super(
      message || 'Data zakończenia musi być późniejsza niż data rozpoczęcia',
    );
  }
}
