import { ConflictException } from '@nestjs/common';

export class ServiceAlreadyExistsException extends ConflictException {
  constructor(message?: string) {
    super(message || 'Podana usługa już istnieje');
  }
}
