import { BadRequestException } from '@nestjs/common';

export class SalonInvalidHoursException extends BadRequestException {
  constructor(message?: string) {
    super(message || 'Nieprawidłowe godziny otwarcia');
  }
}
