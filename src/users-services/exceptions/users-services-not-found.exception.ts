import { NotFoundException } from '@nestjs/common';

export class UserServiceNotFoundException extends NotFoundException {
  constructor(message?: string) {
    super(message || 'Przypisanie usługi nie zostało znalezione');
  }
}
