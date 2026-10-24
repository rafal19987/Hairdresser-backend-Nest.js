import { BadRequestException } from '@nestjs/common';

export class ClientVerificationTokenExpiredException extends BadRequestException {
  constructor(message?: string) {
    super(
      message ||
        'Token weryfikacji wygasł. Poproś o ponowne wysłanie linku aktywacyjnego.',
    );
  }
}
