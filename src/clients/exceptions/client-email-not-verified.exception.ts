import { UnauthorizedException } from '@nestjs/common';

export class ClientEmailNotVerifiedException extends UnauthorizedException {
  constructor(message?: string) {
    super(message || 'Email klienta nie został zweryfikowany');
  }
}
