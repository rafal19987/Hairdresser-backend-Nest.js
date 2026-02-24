import { ConflictException } from '@nestjs/common';

export class UsersServicesAlreadyExistsException extends ConflictException {
  constructor(message?: string) {
    super(message || 'Przypisanie tej usługi do pracownika już istnieje');
  }
}
