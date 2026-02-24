import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  USERS_SERVICES_SERVICE,
  UsersServicesServiceInterface,
} from '@/users-services/interfaces/users-services-service.interface';
import { PaginationParamsDto } from '@/common/dto/pagination-params.dto';
import { PaginatedResultDto } from '@/common/dto/paginated-result.dto';
import { UsersServices } from '@/users-services/entities/users-services.entity';
import { Resource } from '@/roles/enums/resource.enum';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthenticationGuard } from '@/guards/authentication.guard';
import { AuthorizationGuard } from '@/guards/authorization.guard';
import { Action } from '@/roles/enums/action.enum';
import { Permissions } from 'src/decorators/permissions.decorator';
import { ResponseDto } from '@/common/dto/response.dto';
import { CreateUsersServicesDto } from '@/users-services/dto/create-users-services.dto';
import { UpdateUsersServicesDto } from '@/users-services/dto/update-users-services.dto';
import {
  ApiCreateUsersService,
  ApiDeleteUsersService,
  ApiFindAllUsersServices,
  ApiFindByServiceUsersServices,
  ApiFindByUserUsersServices,
  ApiFindOneUsersService,
  ApiUpdateUsersService,
} from '@/users-services/decorators/users-services-swagger.decorator';

@ApiTags('Users Services')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthenticationGuard, AuthorizationGuard)
@Controller('users-services')
@Controller('users-services')
export class UsersServicesController {
  constructor(
    @Inject(USERS_SERVICES_SERVICE)
    private readonly usersServicesService: UsersServicesServiceInterface,
  ) {}

  @ApiFindAllUsersServices()
  @Permissions([{ resource: Resource.SERVICES, actions: [Action.READ] }])
  @Get()
  async findAll(
    @Query() paginationParams: PaginationParamsDto,
  ): Promise<PaginatedResultDto<UsersServices>> {
    return await this.usersServicesService.findAll(paginationParams);
  }

  @ApiFindByUserUsersServices()
  @Permissions([{ resource: Resource.SERVICES, actions: [Action.READ] }])
  @Get('user/:uuid')
  async findByUser(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Query() paginationParams: PaginationParamsDto,
  ): Promise<PaginatedResultDto<UsersServices>> {
    return await this.usersServicesService.findByUser(uuid, paginationParams);
  }

  @ApiFindByServiceUsersServices()
  @Permissions([{ resource: Resource.SERVICES, actions: [Action.READ] }])
  @Get('service/:uuid')
  async findByService(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Query() paginationParams: PaginationParamsDto,
  ): Promise<PaginatedResultDto<UsersServices>> {
    return await this.usersServicesService.findByService(
      uuid,
      paginationParams,
    );
  }

  @ApiFindOneUsersService()
  @Permissions([{ resource: Resource.SERVICES, actions: [Action.READ] }])
  @Get(':uuid')
  async findOne(
    @Param('uuid', ParseUUIDPipe) uuid: string,
  ): Promise<ResponseDto> {
    return await this.usersServicesService.find(uuid);
  }

  @ApiCreateUsersService()
  @Permissions([{ resource: Resource.SERVICES, actions: [Action.CREATE] }])
  @Post()
  async create(
    @Body() createUsersServiceDto: CreateUsersServicesDto,
  ): Promise<ResponseDto> {
    return await this.usersServicesService.create(createUsersServiceDto);
  }

  @ApiUpdateUsersService()
  @Permissions([{ resource: Resource.SERVICES, actions: [Action.WRITE] }])
  @Put(':uuid')
  async update(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Body() updateUsersServiceDto: UpdateUsersServicesDto,
  ): Promise<ResponseDto> {
    return await this.usersServicesService.update(uuid, updateUsersServiceDto);
  }

  @ApiDeleteUsersService()
  @Permissions([{ resource: Resource.SERVICES, actions: [Action.ADMIN] }])
  @Delete(':uuid')
  async remove(
    @Param('uuid', ParseUUIDPipe) uuid: string,
  ): Promise<ResponseDto> {
    return await this.usersServicesService.remove(uuid);
  }
}
