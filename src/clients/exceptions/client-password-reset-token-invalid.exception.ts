import { BadRequestException } from '@nestjs/common';

export class ClientPasswordResetTokenInvalidException extends BadRequestException {
  constructor(message?: string) {
    super(
      message ||
        'Link do zmiany hasła jest nieprawidłowy albo wygasł. Poproś o nowy.',
    );
  }
}
