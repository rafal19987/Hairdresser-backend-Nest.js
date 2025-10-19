import { NotFoundException } from '@nestjs/common';

export class CalendarNotFoundException extends NotFoundException {
  constructor(message?: string) {
    super(message || 'Kalendarz nie został znaleziony');
  }
}
