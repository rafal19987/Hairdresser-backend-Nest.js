import { ConflictException } from '@nestjs/common';

export class AppointmentAlreadyCancelledException extends ConflictException {
  constructor(message?: string) {
    super(message || 'Wizyta jest już anulowana');
  }
}
