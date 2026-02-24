import { ConflictException } from '@nestjs/common';

export class AppointmentConflictException extends ConflictException {
  constructor(message?: string) {
    super(message || 'Wybrany termin jest już zajęty');
  }
}
