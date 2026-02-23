import { UsersServices } from '../entities/users-services.entity';
import { CreateUsersServicesDto } from '../dto/create-users-services.dto';
import { UpdateUsersServicesDto } from '../dto/update-users-services.dto';
import { PaginationParamsDto } from '@/common/dto/pagination-params.dto';
import { PaginatedResultDto } from '@/common/dto/paginated-result.dto';
import { ResponseDto } from '@/common/dto/response.dto';

export interface UsersServicesServiceInterface {
  findAll(
    paginationParams: PaginationParamsDto,
  ): Promise<PaginatedResultDto<UsersServices>>;

  findByUser(
    userUuid: string,
    paginationParams: PaginationParamsDto,
  ): Promise<PaginatedResultDto<UsersServices>>;

  findByService(
    serviceUuid: string,
    paginationParams: PaginationParamsDto,
  ): Promise<PaginatedResultDto<UsersServices>>;

  find(uuid: string): Promise<ResponseDto>;

  create(createUsersServiceDto: CreateUsersServicesDto): Promise<ResponseDto>;

  update(
    uuid: string,
    updateUsersServiceDto: UpdateUsersServicesDto,
  ): Promise<ResponseDto>;

  remove(uuid: string): Promise<ResponseDto>;
}

export const USERS_SERVICES_SERVICE = 'USERS_SERVICES_SERVICE';
