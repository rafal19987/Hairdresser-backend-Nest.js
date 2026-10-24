import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  ClientAuthenticationGuard,
  OptionalClientAuthenticationGuard,
} from './optional-client-authentication.guard';

const CLIENT_SECRET = 'client-secret';
const STAFF_SECRET = 'staff-secret';

describe('OptionalClientAuthenticationGuard', () => {
  const jwtService = new JwtService();
  const configService = {
    get: () => CLIENT_SECRET,
  } as unknown as ConfigService;
  const guard = new OptionalClientAuthenticationGuard(
    jwtService,
    configService,
  );

  const contextFor = (authorization?: string) => {
    const request: Record<string, any> = {
      headers: authorization ? { authorization } : {},
    };

    return {
      request,
      context: {
        switchToHttp: () => ({ getRequest: () => request }),
      } as never,
    };
  };

  it('lets guests through without client id', () => {
    const { request, context } = contextFor();

    expect(guard.canActivate(context)).toBe(true);
    expect(request.clientId).toBeUndefined();
  });

  it('sets client id from valid client token', () => {
    const token = jwtService.sign(
      { clientId: 'client-uuid', type: 'client' },
      { secret: CLIENT_SECRET },
    );
    const { request, context } = contextFor(`Bearer ${token}`);

    expect(guard.canActivate(context)).toBe(true);
    expect(request.clientId).toBe('client-uuid');
  });

  it('rejects staff token', () => {
    const token = jwtService.sign(
      { userId: 'user-uuid' },
      { secret: STAFF_SECRET },
    );
    const { context } = contextFor(`Bearer ${token}`);

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('rejects token signed with client secret but without client type', () => {
    const token = jwtService.sign(
      { clientId: 'client-uuid' },
      { secret: CLIENT_SECRET },
    );
    const { context } = contextFor(`Bearer ${token}`);

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('rejects expired client token', () => {
    const token = jwtService.sign(
      { clientId: 'client-uuid', type: 'client' },
      { secret: CLIENT_SECRET, expiresIn: -10 },
    );
    const { context } = contextFor(`Bearer ${token}`);

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  describe('ClientAuthenticationGuard', () => {
    const requiredGuard = new ClientAuthenticationGuard(
      jwtService,
      configService,
    );

    it('rejects request without token', () => {
      const { context } = contextFor();

      expect(() => requiredGuard.canActivate(context)).toThrow(
        UnauthorizedException,
      );
    });

    it('accepts valid client token', () => {
      const token = jwtService.sign(
        { clientId: 'client-uuid', type: 'client' },
        { secret: CLIENT_SECRET },
      );
      const { request, context } = contextFor(`Bearer ${token}`);

      expect(requiredGuard.canActivate(context)).toBe(true);
      expect(request.clientId).toBe('client-uuid');
    });
  });
});
