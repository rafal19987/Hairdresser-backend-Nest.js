import { NotFoundException } from '@nestjs/common';

export class RoleNotFoundException extends NotFoundException {
  constructor(message?: string) {
    super(message || 'Rola nie została znaleziona');
  }
}
