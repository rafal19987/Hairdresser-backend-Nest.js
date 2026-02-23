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
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Permissions } from '@/decorator/permissions.decorator';
import { Resource } from '@/roles/enums/resource.enum';
import { Action } from '@/roles/enums/action.enum';
import { PaginatedResultDto } from '@/common/dto/paginated-result.dto';
import { PaginationParamsDto } from '@/common/dto/pagination-params.dto';
import {
  SERVICES_SERVICE,
  ServicesServiceInterface,
} from '@/services/interfaces/services-service.interface';
import { ResponseDto } from '@/common/dto/response.dto';
import { Service } from '@/services/entities/service.entity';
import { CreateServiceDto } from '@/services/dto/create-service.dto';
import { EditServiceDto } from '@/services/dto/edit-service.dto';
import { AuthenticationGuard } from '@/guard/authentication.guard';
import { AuthorizationGuard } from '@/guard/authorization.guard';
import {
  ApiCreateService,
  ApiDeleteService,
  ApiFindAllServices,
  ApiFindDeletedServices,
  ApiFindOneService,
  ApiRestoreService,
  ApiSoftDeleteService,
  ApiUpdateService,
} from '@/services/decorators/services-swagger.decorator';

@ApiTags('Services')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthenticationGuard, AuthorizationGuard)
@Controller('services')
export class ServicesController {
  constructor(
    @Inject(SERVICES_SERVICE)
    private readonly servicesService: ServicesServiceInterface,
  ) {}

  @ApiFindAllServices()
  @Permissions([{ resource: Resource.SERVICES, actions: [Action.READ] }])
  @Get()
  async findAll(
    @Query() paginationParams: PaginationParamsDto,
  ): Promise<PaginatedResultDto<Service>> {
    return await this.servicesService.findAll(paginationParams);
  }

  @ApiFindDeletedServices()
  @Permissions([{ resource: Resource.SERVICES, actions: [Action.ALL] }])
  @Get('archive')
  async findDeleted(
    @Query() paginationParams: PaginationParamsDto,
  ): Promise<PaginatedResultDto<Service>> {
    return await this.servicesService.findDeletedAll(paginationParams);
  }

  @ApiFindOneService()
  @Permissions([{ resource: Resource.SERVICES, actions: [Action.READ] }])
  @Get(':uuid')
  async findOne(@Param('uuid', ParseUUIDPipe) uuid: string) {
    return await this.servicesService.find(uuid);
  }

  @ApiCreateService()
  @Permissions([{ resource: Resource.SERVICES, actions: [Action.CREATE] }])
  @Post()
  async create(
    @Body() createServiceDto: CreateServiceDto,
  ): Promise<ResponseDto> {
    return await this.servicesService.create(createServiceDto);
  }

  @ApiUpdateService()
  @Permissions([{ resource: Resource.SERVICES, actions: [Action.WRITE] }])
  @Put(':uuid')
  async update(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Body() editServiceDto: EditServiceDto,
  ): Promise<ResponseDto> {
    return await this.servicesService.update(uuid, editServiceDto);
  }

  @ApiSoftDeleteService()
  @Permissions([{ resource: Resource.SERVICES, actions: [Action.ALL] }])
  @Delete(':uuid')
  async softDelete(
    @Param('uuid', ParseUUIDPipe) uuid: string,
  ): Promise<ResponseDto> {
    return await this.servicesService.softDelete(uuid);
  }

  @ApiDeleteService()
  @Permissions([{ resource: Resource.SERVICES, actions: [Action.ADMIN] }])
  @Delete(':uuid/delete')
  async remove(
    @Param('uuid', ParseUUIDPipe) uuid: string,
  ): Promise<ResponseDto> {
    return await this.servicesService.remove(uuid);
  }

  @ApiRestoreService()
  @Permissions([{ resource: Resource.SERVICES, actions: [Action.ADMIN] }])
  @Put(':uuid/restore')
  async restore(
    @Param('uuid', ParseUUIDPipe) uuid: string,
  ): Promise<ResponseDto> {
    return await this.servicesService.restore(uuid);
  }
}
