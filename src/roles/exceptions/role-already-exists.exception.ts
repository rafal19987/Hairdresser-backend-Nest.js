import { ConflictException } from '@nestjs/common';

export class RoleAlreadyExistsException extends ConflictException {
  constructor(message?: string) {
    super(message || 'Podana rola już istnieje');
  }
}
