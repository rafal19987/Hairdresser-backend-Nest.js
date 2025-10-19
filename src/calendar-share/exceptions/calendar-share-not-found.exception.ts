import { NotFoundException } from '@nestjs/common';

export class CalendarShareNotFoundException extends NotFoundException {
  constructor(message?: string) {
    super(message || 'Udostępnienie kalendarza nie zostało znalezione');
  }
}
