import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  CLIENT_TOKEN_TYPE,
  getClientAccessTokenSecret,
} from '@/auth-client/constants';

// Guests pass through; an invalid token is rejected instead of silently treated as a guest
@Injectable()
export class OptionalClientAuthenticationGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const [scheme, token] = (request.headers['authorization'] ?? '').split(' ');

    if (!token) return true;

    try {
      const payload = this.jwtService.verify(token, {
        secret: getClientAccessTokenSecret(this.configService),
      });

      if (scheme !== 'Bearer' || payload.type !== CLIENT_TOKEN_TYPE) {
        throw new Error('Not a client token');
      }

      request.clientId = payload.clientId;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid client token');
    }
  }
}
