import { SetMetadata } from '@nestjs/common';
import { PermissionDto } from 'src/roles/entities/role.entity';

export const PERMISSIONS_KEY = 'permissions';

export const Permissions = (permissions: PermissionDto[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
