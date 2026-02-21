import { BadRequestException } from '@nestjs/common';

export class PasswordsNotMatchException extends BadRequestException {
  constructor(message?: string) {
    super(message || 'Hasła nie są identyczne');
  }
}