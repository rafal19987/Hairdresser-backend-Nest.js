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
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
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

@ApiTags('Services')
@ApiBearerAuth('JWT-auth')
@Controller('services')
export class ServicesController {
  constructor(
    @Inject(SERVICES_SERVICE)
    private readonly servicesService: ServicesServiceInterface,
  ) {}

  @Permissions([{ resource: Resource.SERVICES, actions: [Action.READ] }])
  @Get()
  @ApiOperation({
    summary: 'Get all services',
    description: 'Retrieves a paginated list of all active services',
  })
  @ApiQuery({
    name: 'page',
    description: 'Page number',
    required: false,
    type: Number,
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    description: 'Number of items per page',
    required: false,
    type: Number,
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: 'List of services retrieved successfully',
    type: PaginatedResultDto,
  })
  @ApiResponse({ status: 404, description: 'No services found' })
  async findAll(
    @Query() paginationParams: PaginationParamsDto,
  ): Promise<PaginatedResultDto<Service>> {
    return await this.servicesService.findAll(paginationParams);
  }

  @Permissions([{ resource: Resource.SERVICES, actions: [Action.ALL] }])
  @Get('archive')
  @ApiOperation({
    summary: 'Get deleted services',
    description: 'Retrieves a paginated list of all deleted services',
  })
  @ApiQuery({
    name: 'page',
    description: 'Page number',
    required: false,
    type: Number,
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    description: 'Number of items per page',
    required: false,
    type: Number,
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: 'List of deleted services retrieved successfully',
    type: PaginatedResultDto,
  })
  @ApiResponse({ status: 404, description: 'No deleted services found' })
  async findDeleted(
    @Query() paginationParams: PaginationParamsDto,
  ): Promise<PaginatedResultDto<Service>> {
    return await this.servicesService.findDeletedAll(paginationParams);
  }

  @Permissions([{ resource: Resource.SERVICES, actions: [Action.READ] }])
  @Get(':id')
  @ApiOperation({
    summary: 'Get service by id',
    description: 'Retrieves a specific service by id',
  })
  @ApiParam({
    name: 'id',
    description: 'Service id',
    type: Number,
    example: '123',
  })
  @ApiResponse({
    status: 200,
    description: 'Service found successfully',
    // type: ResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Service not found' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.servicesService.find(id);
  }

  @Permissions([{ resource: Resource.SERVICES, actions: [Action.CREATE] }])
  @Post()
  @ApiOperation({
    summary: 'Create service',
    description: 'Creates a new service',
  })
  @ApiBody({ type: CreateServiceDto, description: 'Service data' })
  @ApiResponse({
    status: 201,
    description: 'Service created successfully',
    // type: ResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid data' })
  @ApiResponse({
    status: 409,
    description: 'Service with this name already exists',
  })
  async create(
    @Body() createServiceDto: CreateServiceDto,
  ): Promise<ResponseDto> {
    return await this.servicesService.create(createServiceDto);
  }

  @Permissions([{ resource: Resource.SERVICES, actions: [Action.WRITE] }])
  @Put(':id')
  @ApiOperation({
    summary: 'Update service',
    description: 'Updates an existing service',
  })
  @ApiParam({
    name: 'id',
    description: 'Service id',
    type: Number,
    example: '123',
  })
  @ApiBody({ type: EditServiceDto, description: 'Updated service data' })
  @ApiResponse({
    status: 200,
    description: 'Service updated successfully',
    // type: ResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid data' })
  @ApiResponse({ status: 404, description: 'Service not found' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() editServiceDto: EditServiceDto,
  ): Promise<ResponseDto> {
    return await this.servicesService.update(id, editServiceDto);
  }

  @Permissions([{ resource: Resource.SERVICES, actions: [Action.ALL] }])
  @Delete(':id')
  @ApiOperation({
    summary: 'Soft delete service',
    description: 'Marks a service as deleted without removing from database',
  })
  @ApiParam({
    name: 'id',
    description: 'Service id',
    type: Number,
    example: '123',
  })
  @ApiResponse({
    status: 202,
    description: 'Service soft deleted successfully',
    // type: ResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Service not found' })
  async softDelete(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ResponseDto> {
    return await this.servicesService.softDelete(id);
  }

  @Permissions([{ resource: Resource.SERVICES, actions: [Action.ADMIN] }])
  @Delete(':id/delete')
  @ApiOperation({
    summary: 'Permanently delete service',
    description: 'Permanently removes a service from the database',
  })
  @ApiParam({
    name: 'id',
    description: 'Service id',
    type: Number,
    example: '123',
  })
  @ApiResponse({
    status: 200,
    description: 'Service permanently deleted successfully',
    // type: ResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Service not found' })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<ResponseDto> {
    return await this.servicesService.remove(id);
  }

  @Permissions([{ resource: Resource.SERVICES, actions: [Action.ADMIN] }])
  @Put(':id/restore')
  @ApiOperation({
    summary: 'Restore deleted service',
    description: 'Restores a previously soft-deleted service',
  })
  @ApiParam({
    name: 'id',
    description: 'Service id',
    type: Number,
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Service restored successfully',
    // type: ResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Service not found' })
  @ApiResponse({ status: 400, description: 'Service is not deleted' })
  async restore(@Param('id', ParseIntPipe) id: number): Promise<ResponseDto> {
    return await this.servicesService.restore(id);
  }
}
