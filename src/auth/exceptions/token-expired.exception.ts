import { UnauthorizedException } from '@nestjs/common';

export class TokenExpiredException extends UnauthorizedException {
  constructor(message?: string) {
    super(message || 'Token wygasł');
  }
}