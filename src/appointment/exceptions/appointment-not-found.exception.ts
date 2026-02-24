import { NotFoundException } from '@nestjs/common';

export class AppointmentNotFoundException extends NotFoundException {
  constructor(message?: string) {
    super(message || 'Wizyta nie została znaleziona');
  }
}
