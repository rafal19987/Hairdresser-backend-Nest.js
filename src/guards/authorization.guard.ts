import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from 'src/decorators/permissions.decorator';
import { PermissionDto } from 'src/roles/entities/role.entity';
import {
  USERS_SERVICE,
  UsersServiceInterface,
} from '../users/interfaces/users-service.interface';

@Injectable()
export class AuthorizationGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @Inject(USERS_SERVICE) private readonly usersService: UsersServiceInterface,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    if (!request.userId) {
      throw new UnauthorizedException('User Id not found');
    }

    const routePermissions: PermissionDto[] = this.reflector.getAllAndOverride(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );
    console.log(
      ` the route permissions are ${JSON.stringify(routePermissions)}`,
    );

    if (!routePermissions) {
      return true;
    }

    try {
      const userPermissions = await this.usersService.getUserPermissions(
        request.userId,
      );

      console.log(
        ` the user permissions are ${JSON.stringify(userPermissions)}`,
      );

      for (const routePermission of routePermissions) {
        const userPermission = userPermissions.find(
          perm => perm.resource === routePermission.resource,
        );

        if (!userPermission) throw new ForbiddenException();

        const allActionsAvailable = routePermission.actions.every(
          requiredAction => userPermission.actions.includes(requiredAction),
        );
        if (!allActionsAvailable) throw new ForbiddenException();
      }
    } catch (e) {
      throw new ForbiddenException();
    }
    return true;
  }
}
