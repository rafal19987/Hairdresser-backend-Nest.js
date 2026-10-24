import { NotFoundException } from '@nestjs/common';

export class AuditLogNotFoundException extends NotFoundException {
  constructor(message?: string) {
    super(message || 'Wpis w logach nie został znaleziony');
  }
}
