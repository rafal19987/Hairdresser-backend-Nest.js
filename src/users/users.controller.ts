import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { AuthenticationGuard } from 'src/guards/authentication.guard';
import { AuthorizationGuard } from 'src/guards/authorization.guard';
import { Permissions } from 'src/decorators/permissions.decorator';
import { Resource } from 'src/roles/enums/resource.enum';
import { Action } from 'src/roles/enums/action.enum';

@UseGuards(AuthenticationGuard, AuthorizationGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Permissions([{ resource: Resource.USERS, actions: [Action.READ] }])
  @Get()
  async findAll() {
    return await this.usersService.findAll();
  }

  @Permissions([{ resource: Resource.USERS, actions: [Action.CREATE] }])
  @Post()
  async create(@Body() createUserDto: CreateUserDto) {
    return await this.usersService.create(createUserDto);
  }

  @Permissions([{ resource: Resource.USERS, actions: [Action.DELETE] }])
  @Delete(':uuid')
  async remove(@Param('uuid') uuid: string) {
    return await this.usersService.remove(uuid);
  }
}
