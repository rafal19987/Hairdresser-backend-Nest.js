import { ConflictException } from '@nestjs/common';

export class CalendarShareAlreadyExistsException extends ConflictException {
  constructor(message?: string) {
    super(message || 'Kalendarz jest już udostępniony temu użytkownikowi');
  }
}
