import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
} from '@nestjs/swagger';
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
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.servicesService.find(id);
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
  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() editServiceDto: EditServiceDto,
  ): Promise<ResponseDto> {
    return await this.servicesService.update(id, editServiceDto);
  }

  @ApiSoftDeleteService()
  @Permissions([{ resource: Resource.SERVICES, actions: [Action.ALL] }])
  @Delete(':id')
  async softDelete(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ResponseDto> {
    return await this.servicesService.softDelete(id);
  }

  @ApiDeleteService()
  @Permissions([{ resource: Resource.SERVICES, actions: [Action.ADMIN] }])
  @Delete(':id/delete')
  async remove(@Param('id', ParseIntPipe) id: number): Promise<ResponseDto> {
    return await this.servicesService.remove(id);
  }

  @ApiRestoreService()
  @Permissions([{ resource: Resource.SERVICES, actions: [Action.ADMIN] }])
  @Put(':id/restore')
  async restore(@Param('id', ParseIntPipe) id: number): Promise<ResponseDto> {
    return await this.servicesService.restore(id);
  }
}
