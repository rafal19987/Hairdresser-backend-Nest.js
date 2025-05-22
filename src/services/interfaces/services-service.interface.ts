import { Service } from '../entities/service.entity';
import { CreateServiceDto } from '../dto/create-service.dto';
import { PaginationParamsDto } from '@/common/dto/pagination-params.dto';
import { PaginatedResultDto } from '@/common/dto/paginated-result.dto';
import { ResponseDto } from '@/common/dto/response.dto';
import { EditServiceDto } from '../dto/edit-service.dto';

export interface ServicesServiceInterface {
  find(id: number): Promise<ResponseDto>;

  findDeletedAll(
    paginationParams: PaginationParamsDto,
  ): Promise<PaginatedResultDto<Service>>;

  findAll(
    paginationParams: PaginationParamsDto,
  ): Promise<PaginatedResultDto<Service>>;

  create(createUserDto: CreateServiceDto): Promise<ResponseDto>;

  remove(id: number): Promise<ResponseDto>;

  softDelete(id: number): Promise<ResponseDto>;

  update(id: number, editUserDto: EditServiceDto): Promise<ResponseDto>;

  restore(id: number): Promise<ResponseDto>;
}

export const SERVICES_SERVICE = 'SERVICES_SERVICE';
