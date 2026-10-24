import { BadRequestException } from '@nestjs/common';

export class AppointmentUnavailableException extends BadRequestException {
  constructor(message?: string) {
    super(message || 'Wybrana usługa jest niedostępna');
  }
}
