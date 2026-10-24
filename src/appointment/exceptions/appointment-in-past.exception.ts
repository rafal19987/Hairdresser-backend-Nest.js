import { BadRequestException } from '@nestjs/common';

export class AppointmentInPastException extends BadRequestException {
  constructor(message?: string) {
    super(message || 'Nie można zaplanować wizyty w przeszłości');
  }
}
