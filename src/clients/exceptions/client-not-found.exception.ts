import { NotFoundException } from '@nestjs/common';

export class ClientNotFoundException extends NotFoundException {
  constructor(message?: string) {
    super(message || 'Klient nie został znaleziony');
  }
}
