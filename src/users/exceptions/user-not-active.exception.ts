import { ConflictException } from '@nestjs/common';

export class UserNotActiveException extends ConflictException {
  constructor(message?: string) {
    super(message || 'Użytkownik nie jest aktywny');
  }
}