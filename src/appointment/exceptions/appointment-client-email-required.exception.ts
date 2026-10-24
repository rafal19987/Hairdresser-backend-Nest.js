import { BadRequestException } from '@nestjs/common';

export class AppointmentClientEmailRequiredException extends BadRequestException {
  constructor(message?: string) {
    super(message || 'Adres e-mail klienta jest wymagany');
  }
}
