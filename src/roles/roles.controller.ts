import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CreateRoleDto } from './dto/create-role.dto';
import { AuthenticationGuard } from '../guards/authentication.guard';
import { AuthorizationGuard } from '../guards/authorization.guard';
import { Permissions } from '../decorators/permissions.decorator';
import { Resource } from './enums/resource.enum';
import { Action } from './enums/action.enum';
import { ResponseDto } from '../common/dto/response.dto';
import {
  ROLES_SERVICE,
  RolesServiceInterface,
} from './interfaces/role-service.interface';

@UseGuards(AuthenticationGuard, AuthorizationGuard)
@Controller('roles')
export class RolesController {
  constructor(
    @Inject(ROLES_SERVICE) private readonly rolesService: RolesServiceInterface,
  ) {}

  @Permissions([{ resource: Resource.ROLES, actions: [Action.CREATE] }])
  @Post()
  async create(@Body() createRoleDto: CreateRoleDto): Promise<ResponseDto> {
    return await this.rolesService.create(createRoleDto);
  }

  @Permissions([{ resource: Resource.ROLES, actions: [Action.READ] }])
  @Get(':name')
  async getRoleByName(@Param('name') name: string) {
    return await this.rolesService.getRoleByName(name);
  }

  @Permissions([{ resource: Resource.ROLES, actions: [Action.READ] }])
  @Get(':id')
  async getRoleById(@Param('id') id: string) {
    return await this.rolesService.getRoleById(id);
  }
}
