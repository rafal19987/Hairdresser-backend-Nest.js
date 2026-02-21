import { UnauthorizedException } from '@nestjs/common';

export class TokenRevokedException extends UnauthorizedException {
  constructor(message?: string) {
    super(message || 'Token has been revoked');
  }
}