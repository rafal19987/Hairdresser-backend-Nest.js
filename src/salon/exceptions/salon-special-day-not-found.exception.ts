import { NotFoundException } from '@nestjs/common';

export class SalonSpecialDayNotFoundException extends NotFoundException {
  constructor(message?: string) {
    super(message || 'Wyjątek w grafiku nie został znaleziony');
  }
}
