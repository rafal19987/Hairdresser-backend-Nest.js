import { ConflictException } from '@nestjs/common';

export class AppointmentNotModifiableException extends ConflictException {
  constructor(message?: string) {
    super(message || 'Tej wizyty nie można modyfikować');
  }
}
