import { NotFoundException } from '@nestjs/common';

export class SalonNotFoundException extends NotFoundException {
  constructor(message?: string) {
    super(message || 'Ustawienia salonu nie zostały znalezione');
  }
}
