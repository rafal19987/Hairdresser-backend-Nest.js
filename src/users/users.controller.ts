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
  UseGuards,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { AuthenticationGuard } from 'src/guards/authentication.guard';
import { AuthorizationGuard } from 'src/guards/authorization.guard';
import { Permissions } from 'src/decorators/permissions.decorator';
import { Resource } from 'src/roles/enums/resource.enum';
import { Action } from 'src/roles/enums/action.enum';
import { PaginationParamsDto } from '@/common/dto/pagination-params.dto';
import { PaginatedResultDto } from '@/common/dto/paginated-result.dto';
import { User } from './entities/user.entity';
import { ResponseDto } from '@/common/dto/response.dto';
import {
  USERS_SERVICE,
  UsersServiceInterface,
} from './interfaces/users-service.interface';
import { EditUserDto } from './dto/edit-user.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';

@UseGuards(AuthenticationGuard, AuthorizationGuard)
@ApiTags('Users')
@ApiBearerAuth('JWT-auth')
@Controller('users')
export class UsersController {
  constructor(
    @Inject(USERS_SERVICE) private readonly usersService: UsersServiceInterface,
  ) {}

  @Permissions([{ resource: Resource.USERS, actions: [Action.READ] }])
  @Get()
  @ApiOperation({
    summary: 'Get all users',
    description: 'Retrieves a paginated list of all active users',
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
    description: 'List of users retrieved successfully',
    type: PaginatedResultDto,
  })
  @ApiResponse({ status: 404, description: 'No users found' })
  async findAll(
    @Query() paginationParams: PaginationParamsDto,
  ): Promise<PaginatedResultDto<User>> {
    return await this.usersService.findAll(paginationParams);
  }

  @Permissions([{ resource: Resource.USERS, actions: [Action.ALL] }])
  @Get('archive')
  @ApiOperation({
    summary: 'Get deleted users',
    description: 'Retrieves a paginated list of all deleted users',
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
    description: 'List of deleted users retrieved successfully',
    type: PaginatedResultDto,
  })
  @ApiResponse({ status: 404, description: 'No deleted users found' })
  async findDeleted(
    @Query() paginationParams: PaginationParamsDto,
  ): Promise<PaginatedResultDto<User>> {
    return await this.usersService.findDeletedAll(paginationParams);
  }

  @Permissions([{ resource: Resource.USERS, actions: [Action.READ] }])
  @Get(':uuid')
  @ApiOperation({
    summary: 'Get user by UUID',
    description: 'Retrieves a specific user by UUID',
  })
  @ApiParam({
    name: 'uuid',
    description: 'User UUID',
    type: String,
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'User found successfully',
    // type: ResponseDto,
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findOne(@Param('uuid') uuid: string) {
    return await this.usersService.find(uuid);
  }

  @Permissions([{ resource: Resource.USERS, actions: [Action.CREATE] }])
  @Post()
  @ApiOperation({ summary: 'Create user', description: 'Creates a new user' })
  @ApiBody({ type: CreateUserDto, description: 'User data' })
  @ApiResponse({
    status: 201,
    description: 'User created successfully',
    // type: ResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid data' })
  @ApiResponse({
    status: 409,
    description: 'User with this email already exists',
  })
  async create(@Body() createUserDto: CreateUserDto): Promise<ResponseDto> {
    return await this.usersService.create(createUserDto);
  }

  @Permissions([{ resource: Resource.USERS, actions: [Action.WRITE] }])
  @Put(':uuid')
  @ApiOperation({
    summary: 'Update user',
    description: 'Updates an existing user',
  })
  @ApiParam({
    name: 'uuid',
    description: 'User UUID',
    type: String,
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiBody({ type: EditUserDto, description: 'Updated user data' })
  @ApiResponse({
    status: 200,
    description: 'User updated successfully',
    // type: ResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid data' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async update(
    @Param('uuid') uuid: string,
    @Body() editUserDto: EditUserDto,
  ): Promise<ResponseDto> {
    return await this.usersService.update(uuid, editUserDto);
  }

  @Permissions([{ resource: Resource.USERS, actions: [Action.ALL] }])
  @Delete(':uuid')
  @ApiOperation({
    summary: 'Soft delete user',
    description: 'Marks a user as deleted without removing from database',
  })
  @ApiParam({
    name: 'uuid',
    description: 'User UUID',
    type: String,
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 202,
    description: 'User soft deleted successfully',
    // type: ResponseDto,
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async softDelete(@Param('uuid') uuid: string): Promise<ResponseDto> {
    return await this.usersService.softDelete(uuid);
  }

  @Permissions([{ resource: Resource.USERS, actions: [Action.ADMIN] }])
  @Delete(':uuid/delete')
  @ApiOperation({
    summary: 'Permanently delete user',
    description: 'Permanently removes a user from the database',
  })
  @ApiParam({
    name: 'uuid',
    description: 'User UUID',
    type: String,
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'User permanently deleted successfully',
    // type: ResponseDto,
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async remove(@Param('uuid') uuid: string): Promise<ResponseDto> {
    return await this.usersService.remove(uuid);
  }
}
