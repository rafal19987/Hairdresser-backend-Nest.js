import { ConflictException } from '@nestjs/common';

export class ClientAlreadyExistsException extends ConflictException {
  constructor(message?: string) {
    super(message || 'Klient z podanym emailem już istnieje');
  }
}
