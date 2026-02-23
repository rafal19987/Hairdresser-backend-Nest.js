import { HttpStatus, Injectable } from '@nestjs/common';
import { UsersServicesServiceInterface } from '@/users-services/interfaces/users-services-service.interface';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '@/users/entities/user.entity';
import { Service } from '@/services/entities/service.entity';
import { UsersServices } from '@/users-services/entities/users-services.entity';
import { ResponseDto } from '@/common/dto/response.dto';
import { ResponseHelper } from '@/common/helpers/response.helper';
import { UserServiceNotFoundException } from '@/users-services/exceptions/users-services-not-found.exception';
import { UpdateUsersServicesDto } from '@/users-services/dto/update-users-services.dto';
import { UsersServicesAlreadyExistsException } from '@/users-services/exceptions/users-services-already-exists.exception';
import { createPaginatedResponse } from '@/common/helpers/pagination.helper';
import { PaginatedResultDto } from '@/common/dto/paginated-result.dto';
import { PaginationParamsDto } from '@/common/dto/pagination-params.dto';
import { CreateUsersServicesDto } from '@/users-services/dto/create-users-services.dto';
import { UsersServicesUserNotFoundException } from '@/users-services/exceptions/users-services-user-not-found.exception';
import { UsersServicesServiceNotFoundException } from '@/users-services/exceptions/users-services-service-not-found.exception';

@Injectable()
export class UsersServicesService implements UsersServicesServiceInterface {
  constructor(
    @InjectRepository(UsersServices)
    private readonly userServiceRepository: Repository<UsersServices>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,
  ) {}

  public async findAll(
    paginationParams: PaginationParamsDto,
  ): Promise<PaginatedResultDto<UsersServices>> {
    const { page, limit, query } = paginationParams;
    const skip = (page - 1) * limit;

    const qb = this.userServiceRepository
      .createQueryBuilder('userService')
      .leftJoinAndSelect('userService.user', 'user')
      .leftJoinAndSelect('userService.service', 'service')
      .orderBy('userService.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    if (query) {
      qb.andWhere(
        `(
        user.firstName LIKE :query OR
        user.lastName LIKE :query OR
        user.email LIKE :query OR
        service.name LIKE :query
      )`,
        { query: `%${query}%` },
      );
    }

    const [userServices, total] = await qb.getManyAndCount();

    return createPaginatedResponse(userServices, total, paginationParams);
  }

  public async findByUser(
    userUuid: string,
    paginationParams: PaginationParamsDto,
  ): Promise<PaginatedResultDto<UsersServices>> {
    const { page, limit } = paginationParams;
    const skip = (page - 1) * limit;

    const [userServices, total] = await this.userServiceRepository.findAndCount(
      {
        where: { user: { uuid: userUuid } },
        skip,
        take: limit,
        order: { createdAt: 'DESC' },
      },
    );

    return createPaginatedResponse(userServices, total, paginationParams);
  }

  public async findByService(
    serviceUuid: string,
    paginationParams: PaginationParamsDto,
  ): Promise<PaginatedResultDto<UsersServices>> {
    const { page, limit } = paginationParams;
    const skip = (page - 1) * limit;

    const [userServices, total] = await this.userServiceRepository.findAndCount(
      {
        where: { service: { uuid: serviceUuid } },
        skip,
        take: limit,
        order: { createdAt: 'DESC' },
      },
    );

    return createPaginatedResponse(userServices, total, paginationParams);
  }

  public async find(uuid: string): Promise<ResponseDto> {
    const userService = await this.userServiceRepository.findOne({
      where: { uuid },
      relations: ['user', 'service'],
    });

    if (!userService) throw new UserServiceNotFoundException();

    return ResponseHelper.success(
      'User service found',
      HttpStatus.OK,
      userService,
    );
  }

  public async create(
    createUsersServiceDto: CreateUsersServicesDto,
  ): Promise<ResponseDto> {
    const user = await this.userRepository.findOneBy({
      uuid: createUsersServiceDto.userUuid,
    });

    if (!user) throw new UsersServicesUserNotFoundException();

    const service = await this.serviceRepository.findOneBy({
      uuid: createUsersServiceDto.serviceUuid,
    });

    if (!service) throw new UsersServicesServiceNotFoundException();

    const existing = await this.userServiceRepository.findOne({
      where: {
        user: { uuid: createUsersServiceDto.userUuid },
        service: { uuid: createUsersServiceDto.serviceUuid },
      },
      relations: ['user', 'service'],
    });

    if (existing) throw new UsersServicesAlreadyExistsException();

    const newUserService = await this.userServiceRepository.save({
      user,
      service,
      price: createUsersServiceDto.price,
      duration: createUsersServiceDto.duration,
      active: createUsersServiceDto.active ?? true,
    });

    return ResponseHelper.created(
      'User service successfully created',
      newUserService,
    );
  }

  public async update(
    uuid: string,
    updateUsersServiceDto: UpdateUsersServicesDto,
  ): Promise<ResponseDto> {
    const userService = await this.userServiceRepository.findOneBy({ uuid });

    if (!userService) throw new UserServiceNotFoundException();

    if (updateUsersServiceDto.price !== undefined) {
      userService.price = updateUsersServiceDto.price;
    }

    if (updateUsersServiceDto.duration !== undefined) {
      userService.duration = updateUsersServiceDto.duration;
    }

    if (updateUsersServiceDto.active !== undefined) {
      userService.active = updateUsersServiceDto.active;
    }

    await this.userServiceRepository.save(userService);

    return ResponseHelper.updated(
      'User service successfully updated',
      userService.uuid,
    );
  }

  public async remove(uuid: string): Promise<ResponseDto> {
    const userService = await this.userServiceRepository.findOneBy({ uuid });

    if (!userService) throw new UserServiceNotFoundException();

    await this.userServiceRepository.remove(userService);

    return ResponseHelper.deleted('User service successfully deleted');
  }
}
