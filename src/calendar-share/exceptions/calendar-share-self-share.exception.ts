import { BadRequestException } from '@nestjs/common';

export class CalendarShareSelfShareException extends BadRequestException {
  constructor(message?: string) {
    super(message || 'Nie można udostępnić kalendarza samemu sobie');
  }
}
