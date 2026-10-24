import { ConflictException } from '@nestjs/common';

export class SalonSpecialDayAlreadyExistsException extends ConflictException {
  constructor(message?: string) {
    super(message || 'Dla tej daty istnieje już wyjątek w grafiku');
  }
}
