import { ConflictException } from '@nestjs/common';

export class UserAlreadyExistsException extends ConflictException {
  constructor(message?: string) {
    super(message || 'Podany użytkownik już istnieje');
  }
}
