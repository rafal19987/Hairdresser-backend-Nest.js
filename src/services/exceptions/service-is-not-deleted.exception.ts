import { ConflictException } from '@nestjs/common';

export class ServiceIsNotDeletedException extends ConflictException {
  constructor(message?: string) {
    super(message || 'Podana usługa nie została usunięta');
  }
}
