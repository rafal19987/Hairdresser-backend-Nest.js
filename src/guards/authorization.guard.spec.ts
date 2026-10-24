import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthorizationGuard } from './authorization.guard';
import { UserNotActiveException } from '@/users/exceptions/user-not-active.exception';
import { Resource } from '@/roles/enums/resource.enum';
import { Action } from '@/roles/enums/action.enum';

describe('AuthorizationGuard', () => {
  const usersService = { getUserPermissions: jest.fn() };
  const reflector = {
    getAllAndOverride: jest
      .fn()
      .mockReturnValue([{ resource: Resource.USERS, actions: [Action.READ] }]),
  };

  const guard = new AuthorizationGuard(
    reflector as unknown as Reflector,
    usersService as any,
  );

  const context = {
    switchToHttp: () => ({ getRequest: () => ({ userId: 'user-1' }) }),
    getHandler: () => null,
    getClass: () => null,
  } as unknown as ExecutionContext;

  beforeEach(() => jest.clearAllMocks());

  it('rejects inactive user with 401', async () => {
    usersService.getUserPermissions.mockRejectedValue(
      new UserNotActiveException(),
    );

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('allows user with required permission', async () => {
    usersService.getUserPermissions.mockResolvedValue([
      { resource: Resource.USERS, actions: [Action.READ] },
    ]);

    await expect(guard.canActivate(context)).resolves.toBe(true);
  });
});
