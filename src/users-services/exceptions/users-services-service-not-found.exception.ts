import { NotFoundException } from '@nestjs/common';

export class UsersServicesServiceNotFoundException extends NotFoundException {
  constructor(message?: string) {
    super(message || 'Podana usługa nie została znaleziona');
  }
}
