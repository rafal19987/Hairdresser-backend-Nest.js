import { ConflictException } from '@nestjs/common';

export class UserAlreadyActiveException extends ConflictException {
  constructor(message?: string) {
    super(message || 'Użytkownik ma już aktywne konto');
  }
}