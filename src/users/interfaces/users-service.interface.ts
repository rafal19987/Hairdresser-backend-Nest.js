import { User } from '../entities/user.entity';
import { CreateUserDto } from '../dto/create-user.dto';
import { PaginationParamsDto } from '../../common/dto/pagination-params.dto';
import { PaginatedResultDto } from '../../common/dto/paginated-result.dto';
import { ResponseDto } from '../../common/dto/response.dto';
import { PermissionDto } from '../../roles/entities/role.entity';
import { EditUserDto } from '../dto/edit-user.dto';

export interface UsersServiceInterface {
  find(uuid: string): Promise<ResponseDto>;

  findDeletedAll(
    paginationParams: PaginationParamsDto,
  ): Promise<PaginatedResultDto<User>>;

  findAll(
    paginationParams: PaginationParamsDto,
  ): Promise<PaginatedResultDto<User>>;

  create(createUserDto: CreateUserDto): Promise<ResponseDto>;

  remove(uuid: string): Promise<ResponseDto>;

  softDelete(uuid: string): Promise<ResponseDto>;

  getUserPermissions(userId: string): Promise<PermissionDto[]>;

  update(uuid: string, editUserDto: EditUserDto): Promise<ResponseDto>;
}

export const USERS_SERVICE = 'USERS_SERVICE';
