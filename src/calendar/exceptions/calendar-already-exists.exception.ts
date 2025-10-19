import { ConflictException } from '@nestjs/common';

export class CalendarAlreadyExistsException extends ConflictException {
  constructor(message?: string) {
    super(
      message || 'Kalendarz o tej nazwie już istnieje dla tego użytkownika',
    );
  }
}
