import { Client } from '../entities/client.entity';
import { CreateClientDto } from '../dto/create-client.dto';
import { UpdateClientDto } from '../dto/update-client.dto';
import { PaginationParamsDto } from '@/common/dto/pagination-params.dto';
import { PaginatedResultDto } from '@/common/dto/paginated-result.dto';
import { ResponseDto } from '@/common/dto/response.dto';

export interface ClientsServiceInterface {
  findAll(
    paginationParams: PaginationParamsDto,
  ): Promise<PaginatedResultDto<Client>>;

  find(uuid: string): Promise<ResponseDto>;

  create(createClientDto: CreateClientDto): Promise<ResponseDto>;

  update(uuid: string, updateClientDto: UpdateClientDto): Promise<ResponseDto>;

  remove(uuid: string): Promise<ResponseDto>;

  verifyEmail(token: string): Promise<ResponseDto>;
}

export const CLIENTS_SERVICE = 'CLIENTS_SERVICE';
