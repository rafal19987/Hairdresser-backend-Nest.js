import { NotFoundException } from '@nestjs/common';

export class UserNotFoundException extends NotFoundException {
  constructor(message?: string) {
    super(message || 'Użytkownik nie został znaleziony');
  }
}
