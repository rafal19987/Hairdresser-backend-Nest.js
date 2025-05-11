import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { AuthenticationGuard } from 'src/guards/authentication.guard';
import { AuthorizationGuard } from 'src/guards/authorization.guard';
import { Permissions } from 'src/decorators/permissions.decorator';
import { Resource } from 'src/roles/enums/resource.enum';
import { Action } from 'src/roles/enums/action.enum';
import { PaginationParamsDto } from '../common/dto/pagination-params.dto';
import { PaginatedResultDto } from '../common/dto/paginated-result.dto';
import { User } from './entities/user.entity';
import { ResponseDto } from '../common/dto/response.dto';
import {
  USERS_SERVICE,
  UsersServiceInterface,
} from './interfaces/users-service.interface';
import { EditUserDto } from './dto/edit-user.dto';

// @UseGuards(AuthenticationGuard, AuthorizationGuard)
@Controller('users')
export class UsersController {
  constructor(
    @Inject(USERS_SERVICE) private readonly usersService: UsersServiceInterface,
  ) {}

  @Permissions([{ resource: Resource.USERS, actions: [Action.READ] }])
  @Get()
  async findAll(
    @Query() paginationParams: PaginationParamsDto,
  ): Promise<PaginatedResultDto<User>> {
    return await this.usersService.findAll(paginationParams);
  }

  @Permissions([{ resource: Resource.USERS, actions: [Action.ALL] }])
  @Get('archive')
  async findDeleted(
    @Query() paginationParams: PaginationParamsDto,
  ): Promise<PaginatedResultDto<User>> {
    return await this.usersService.findDeletedAll(paginationParams);
  }

  @Permissions([{ resource: Resource.USERS, actions: [Action.READ] }])
  @Get(':uuid')
  async findOne(@Param('uuid') uuid: string) {
    return await this.usersService.find(uuid);
  }

  @Permissions([{ resource: Resource.USERS, actions: [Action.CREATE] }])
  @Post()
  async create(@Body() createUserDto: CreateUserDto): Promise<ResponseDto> {
    return await this.usersService.create(createUserDto);
  }

  @Permissions([{ resource: Resource.USERS, actions: [Action.WRITE] }])
  @Put(':uuid')
  async update(
    @Param('uuid') uuid: string,
    @Body() editUserDto: EditUserDto,
  ): Promise<ResponseDto> {
    return await this.usersService.update(uuid, editUserDto);
  }

  @Permissions([{ resource: Resource.USERS, actions: [Action.ALL] }])
  @Delete(':uuid')
  async softDelete(@Param('uuid') uuid: string): Promise<ResponseDto> {
    return await this.usersService.softDelete(uuid);
  }

  @Permissions([{ resource: Resource.USERS, actions: [Action.ADMIN] }])
  @Delete(':uuid/delete')
  async remove(@Param('uuid') uuid: string): Promise<ResponseDto> {
    return await this.usersService.remove(uuid);
  }
}
