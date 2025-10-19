import { ConflictException } from '@nestjs/common';

export class CalendarIsNotDeletedException extends ConflictException {
  constructor(message?: string) {
    super(message || 'Kalendarz nie został usunięty');
  }
}
