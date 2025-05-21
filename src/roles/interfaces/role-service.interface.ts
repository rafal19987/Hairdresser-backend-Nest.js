import { ResponseDto } from '../../common/dto/response.dto';
import { CreateRoleDto } from '../dto/create-role.dto';
import { Role } from '../entities/role.entity';

export interface RolesServiceInterface {
  create(createRoleDto: CreateRoleDto): Promise<ResponseDto>;

  getRoleById(roleId: string): Promise<Role>;

  getRoleByName(name: string): Promise<Role>;
}

export const ROLES_SERVICE = 'ROLES_SERVICE';
