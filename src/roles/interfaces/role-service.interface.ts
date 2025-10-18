import { ResponseDto } from '@/common/dto/response.dto';
import { CreateRoleDto } from '../dto/create-role.dto';
import { Role } from '../entities/role.entity';
import { PaginationParamsDto } from '@/common/dto/pagination-params.dto';
import { PaginatedResultDto } from '@/common/dto/paginated-result.dto';

export interface RolesServiceInterface {
  findAll(
    paginationParams: PaginationParamsDto,
  ): Promise<PaginatedResultDto<Role>>;

  create(createRoleDto: CreateRoleDto): Promise<ResponseDto>;

  getRoleById(roleId: string): Promise<Role>;

  // getRoleByName(name: string): Promise<Role>;
}

export const ROLES_SERVICE = 'ROLES_SERVICE';
