import { NotFoundException } from '@nestjs/common';

export class ServiceNotFoundException extends NotFoundException {
  constructor(message?: string) {
    super(message || 'Usługa nie została znaleziona');
  }
}
