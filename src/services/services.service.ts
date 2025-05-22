import { HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ResponseDto } from '@/common/dto/response.dto';
import { ResponseHelper } from '@/common/helpers/response.helper';
import { PaginationParamsDto } from '@/common/dto/pagination-params.dto';
import { PaginatedResultDto } from '@/common/dto/paginated-result.dto';
import { createPaginatedResponse } from '@/common/helpers/pagination.helper';
import { ServicesServiceInterface } from '@/services/interfaces/services-service.interface';
import { Service } from '@/services/entities/service.entity';
import { ServiceNotFoundException } from '@/services/exceptions/service-not-found.exception';
import { CreateServiceDto } from '@/services/dto/create-service.dto';
import { ServiceAlreadyExistsException } from '@/services/exceptions/service-already-exists.exception';
import { EditServiceDto } from '@/services/dto/edit-service.dto';
import { ServiceIsNotDeletedException } from '@/services/exceptions/service-is-not-deleted.exception';

@Injectable()
export class ServicesService implements ServicesServiceInterface {
  constructor(
    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,
  ) {}

  public async find(id: number): Promise<ResponseDto> {
    const service = await this.serviceRepository.findOneBy({ id });

    if (!service) throw new ServiceNotFoundException();

    return ResponseHelper.success('Service found', HttpStatus.OK, service);
  }

  public async findDeletedAll(
    paginationParams: PaginationParamsDto,
  ): Promise<PaginatedResultDto<Service>> {
    const { page, limit } = paginationParams;

    const skip = (page - 1) * limit;

    const [services, total] = await this.serviceRepository.findAndCount({
      skip,
      take: limit,
      where: [{ deleted: true }],
      withDeleted: true,
      order: { createdAt: 'DESC' },
    });

    if (!services || services.length === 0) {
      throw new NotFoundException('No deleted services found');
    }

    return createPaginatedResponse(services, total, paginationParams);
  }

  public async findAll(
    paginationParams: PaginationParamsDto,
  ): Promise<PaginatedResultDto<Service>> {
    const { page, limit } = paginationParams;

    const skip = (page - 1) * limit;

    const [services, total] = await this.serviceRepository.findAndCount({
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    if (!services || services.length === 0) {
      throw new ServiceNotFoundException('No services found');
    }

    return createPaginatedResponse(services, total, paginationParams);
  }

  public async create(createServiceDto: CreateServiceDto) {
    const service = await this.serviceRepository.findOneBy({
      name: createServiceDto.name,
    });

    if (service) throw new ServiceAlreadyExistsException();

    const newService = await this.serviceRepository.save({
      name: createServiceDto.name,
      description: createServiceDto.description,
      active: createServiceDto.active,
    });

    return ResponseHelper.created('Service successfully created', newService);
  }

  public async update(
    id: number,
    editServiceDto: EditServiceDto,
  ): Promise<ResponseDto> {
    const service = await this.serviceRepository.findOneBy({
      id,
    });

    if (!service) throw new ServiceNotFoundException();

    service.name = editServiceDto.name;
    service.description = editServiceDto.description;
    service.active = editServiceDto.active;

    await this.serviceRepository.save(service);

    return ResponseHelper.updated('Service successfully updated', service.id);
  }

  public async remove(id: number): Promise<ResponseDto> {
    const service = await this.serviceRepository.findOne({
      where: { id },
      withDeleted: true,
    });

    if (!service) throw new ServiceNotFoundException();

    await this.serviceRepository.remove(service);

    return ResponseHelper.deleted('Service successfully deleted');
  }

  public async softDelete(id: number): Promise<ResponseDto> {
    const service = await this.serviceRepository.findOneBy({
      id,
    });

    if (!service) throw new ServiceNotFoundException();

    service.deleted = true;
    service.active = false;

    await this.serviceRepository.save(service);

    await this.serviceRepository.softDelete({ id });

    return ResponseHelper.softDeleted('Service successfully soft deleted');
  }

  public async restore(id: number): Promise<ResponseDto> {
    const service = await this.serviceRepository.findOne({
      where: { id },
      withDeleted: true,
    });

    if (!service) throw new ServiceNotFoundException();

    if (!service.deleted) throw new ServiceIsNotDeletedException();

    service.deleted = false;

    await this.serviceRepository.save(service);

    await this.serviceRepository.recover({ id });

    return ResponseHelper.restored('Service successfully restored');
  }
}
