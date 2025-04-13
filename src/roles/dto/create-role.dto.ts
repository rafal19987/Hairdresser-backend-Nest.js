import { Permission } from '../entities/role.entity';

export class CreateRoleDto {
  name: string;
  description?: string;
  permissions: Permission[];
}
