import { BadRequestException } from '@nestjs/common';

export class BookingGuestDetailsRequiredException extends BadRequestException {
  constructor(message?: string) {
    super(message || 'Podaj imię i adres email albo zaloguj się na konto');
  }
}
