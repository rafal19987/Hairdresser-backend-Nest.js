import { NotFoundException } from '@nestjs/common';

export class UsersServicesUserNotFoundException extends NotFoundException {
  constructor(message?: string) {
    super(message || 'Podany pracownik nie został znaleziony');
  }
}
