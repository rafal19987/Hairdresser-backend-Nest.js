import {
    Injectable,
    CanActivate,
    ExecutionContext,
    UnauthorizedException,
    ForbiddenException,
    Inject, InternalServerErrorException, NotFoundException,
} from '@nestjs/common';
import {Reflector} from '@nestjs/core';
import {PERMISSIONS_KEY} from 'src/decorators/permissions.decorator';
import {PermissionDto} from 'src/roles/entities/role.entity';
import {
    USERS_SERVICE,
    UsersServiceInterface,
} from '@/users/interfaces/users-service.interface';
import {UserNotFoundException} from "@/users/exceptions/user-not-found.exception";

@Injectable()
export class AuthorizationGuard implements CanActivate {
    constructor(
        private reflector: Reflector,
        @Inject(USERS_SERVICE) private readonly usersService: UsersServiceInterface,
    ) {
    }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();

        if (!request.userId) {
            throw new UnauthorizedException('User Id not found');
        }

        const routePermissions: PermissionDto[] = this.reflector.getAllAndOverride(
            PERMISSIONS_KEY,
            [context.getHandler(), context.getClass()],
        );

        if (!routePermissions) {
            return true;
        }

        let userPermissions: PermissionDto[];

        try {
            userPermissions = await this.usersService.getUserPermissions(request.userId);
        } catch (e) {
            if (e instanceof UserNotFoundException) {
                throw new UnauthorizedException('User not found');
            }
            throw new InternalServerErrorException('Error fetching user permissions');
        }

        for (const routePermission of routePermissions) {
            const userPermission = userPermissions.find(
                perm => perm.resource === routePermission.resource,
            );

            if (!userPermission) throw new ForbiddenException('Brak dostępu do zasobu');

            const allActionsAvailable = routePermission.actions.every(
                requiredAction => userPermission.actions.includes(requiredAction),
            );

            if (!allActionsAvailable) throw new ForbiddenException('Brak wymaganych uprawnień');
        }

        return true;
    }
}
