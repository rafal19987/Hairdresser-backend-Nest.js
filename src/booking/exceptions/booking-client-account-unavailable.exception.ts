import { UnauthorizedException } from '@nestjs/common';

export class BookingClientAccountUnavailableException extends UnauthorizedException {
  constructor(message?: string) {
    super(message || 'Konto klienta jest nieaktywne lub niepotwierdzone');
  }
}
