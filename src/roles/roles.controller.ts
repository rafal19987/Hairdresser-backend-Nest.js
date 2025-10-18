import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CreateRoleDto } from './dto/create-role.dto';
import { AuthenticationGuard } from '@/guard/authentication.guard';
import { AuthorizationGuard } from '@/guard/authorization.guard';
import { Permissions } from '@/decorator/permissions.decorator';
import { Resource } from './enums/resource.enum';
import { Action } from './enums/action.enum';
import { ResponseDto } from '@/common/dto/response.dto';
import {
  ROLES_SERVICE,
  RolesServiceInterface,
} from './interfaces/role-service.interface';
import { ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { PaginatedResultDto } from '@/common/dto/paginated-result.dto';
import { PaginationParamsDto } from '@/common/dto/pagination-params.dto';
import { Role } from '@/roles/entities/role.entity';

@UseGuards(AuthenticationGuard, AuthorizationGuard)
@Controller('roles')
export class RolesController {
  constructor(
    @Inject(ROLES_SERVICE) private readonly rolesService: RolesServiceInterface,
  ) {}

  @Permissions([{ resource: Resource.ROLES, actions: [Action.READ] }])
  @Get()
  @ApiOperation({
    summary: 'Get all roles',
    description: 'Retrieves a paginated list of all active roles',
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
    description: 'List of roles retrieved successfully',
    type: PaginatedResultDto,
  })
  @ApiResponse({ status: 404, description: 'No roles found' })
  async findAll(
    @Query() paginationParams: PaginationParamsDto,
  ): Promise<PaginatedResultDto<Role>> {
    return await this.rolesService.findAll(paginationParams);
  }

  @Permissions([{ resource: Resource.ROLES, actions: [Action.CREATE] }])
  @Post()
  async create(@Body() createRoleDto: CreateRoleDto): Promise<ResponseDto> {
    return await this.rolesService.create(createRoleDto);
  }

  // @Permissions([{ resource: Resource.ROLES, actions: [Action.READ] }])
  // @Get(':name')
  // async getRoleByName(@Param('name') name: string) {
  //   return await this.rolesService.getRoleByName(name);
  // }

  @Permissions([{ resource: Resource.ROLES, actions: [Action.READ] }])
  @Get(':id')
  async getRoleById(@Param('id') id: string) {
    return await this.rolesService.getRoleById(id);
  }
}
