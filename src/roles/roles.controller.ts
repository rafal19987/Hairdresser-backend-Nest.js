import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';

@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  async createRole(@Body() createRoleDto: CreateRoleDto) {
    return await this.rolesService.createRole(createRoleDto);
  }

  @Get(':name')
  async getRoleByName(@Param('name') name: string) {
    return await this.rolesService.getRoleByName(name);
  }

  @Get(':id')
  async getRoleById(@Param('id') id: string) {
    return await this.rolesService.getRoleById(id);
  }
}
