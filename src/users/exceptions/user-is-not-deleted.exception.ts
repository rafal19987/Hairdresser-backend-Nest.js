import { ConflictException } from '@nestjs/common';

export class UserIsNotDeletedException extends ConflictException {
  constructor(message?: string) {
    super(message || 'Podany użytkownik nie został usunięty');
  }
}
