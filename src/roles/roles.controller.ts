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
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PaginatedResultDto } from '@/common/dto/paginated-result.dto';
import { PaginationParamsDto } from '@/common/dto/pagination-params.dto';
import { Role } from '@/roles/entities/role.entity';
import {
  ApiCreateRole,
  ApiFindAllRoles,
  ApiGetRoleById,
} from '@/roles/decorators/roles-swagger.decorator';

@ApiTags('Roles')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthenticationGuard, AuthorizationGuard)
@Controller('roles')
export class RolesController {
  constructor(
    @Inject(ROLES_SERVICE) private readonly rolesService: RolesServiceInterface,
  ) {}

  @ApiFindAllRoles()
  @Permissions([{ resource: Resource.ROLES, actions: [Action.READ] }])
  @Get()
  async findAll(
    @Query() paginationParams: PaginationParamsDto,
  ): Promise<PaginatedResultDto<Role>> {
    return await this.rolesService.findAll(paginationParams);
  }

  @ApiCreateRole()
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

  @ApiGetRoleById()
  @Permissions([{ resource: Resource.ROLES, actions: [Action.READ] }])
  @Get(':id')
  async getRoleById(@Param('id') id: string) {
    return await this.rolesService.getRoleById(id);
  }
}
