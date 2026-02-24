import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { CreateUsersServicesDto } from '@/users-services/dto/create-users-services.dto';
import { UpdateUsersServicesDto } from '@/users-services/dto/update-users-services.dto';
import { PaginatedResultDto } from '@/common/dto/paginated-result.dto';

const UuidParam = () =>
  ApiParam({
    name: 'uuid',
    description: 'User Services UUID',
    type: String,
    example: '123e4567-e89b-12d3-a456-426614174000',
  });

const PaginationQuery = () =>
  applyDecorators(
    ApiQuery({ name: 'page', required: false, type: Number, example: 1 }),
    ApiQuery({ name: 'limit', required: false, type: Number, example: 10 }),
  );

export function ApiFindAllUsersServices() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get all user services',
      description: 'Retrieves a paginated list of all user service assignments',
    }),
    PaginationQuery(),
    ApiResponse({
      status: 200,
      description: 'List of user services retrieved successfully',
      type: PaginatedResultDto,
    }),
  );
}

export function ApiFindByUserUsersServices() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get services by user',
      description: 'Retrieves all services assigned to a specific user',
    }),
    ApiParam({ name: 'uuid', description: 'User UUID', type: String }),
    PaginationQuery(),
    ApiResponse({
      status: 200,
      description: 'List of services for user retrieved successfully',
      type: PaginatedResultDto,
    }),
    ApiResponse({ status: 404, description: 'User not found' }),
  );
}

export function ApiFindByServiceUsersServices() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get users by service',
      description:
        'Retrieves all users assigned to a specific service with price and duration',
    }),
    ApiParam({ name: 'uuid', description: 'Service UUID', type: String }),
    PaginationQuery(),
    ApiResponse({
      status: 200,
      description: 'List of users for service retrieved successfully',
      type: PaginatedResultDto,
    }),
    ApiResponse({ status: 404, description: 'Service not found' }),
  );
}

export function ApiFindOneUsersService() {
  return applyDecorators(
    ApiOperation({ summary: 'Get user service by UUID' }),
    UuidParam(),
    ApiResponse({
      status: 200,
      description: 'User service found successfully',
    }),
    ApiResponse({ status: 404, description: 'User service not found' }),
  );
}

export function ApiCreateUsersService() {
  return applyDecorators(
    ApiOperation({
      summary: 'Create user service',
      description: 'Assigns a service to a user with price and duration',
    }),
    ApiBody({ type: CreateUsersServicesDto }),
    ApiResponse({
      status: 201,
      description: 'User service successfully created',
    }),
    ApiResponse({ status: 404, description: 'User or service not found' }),
    ApiResponse({ status: 409, description: 'User service already exists' }),
  );
}

export function ApiUpdateUsersService() {
  return applyDecorators(
    ApiOperation({
      summary: 'Update user service',
      description:
        'Updates price, duration or active status of a user service assignment',
    }),
    UuidParam(),
    ApiBody({ type: UpdateUsersServicesDto }),
    ApiResponse({
      status: 200,
      description: 'User service successfully updated',
    }),
    ApiResponse({ status: 404, description: 'User service not found' }),
  );
}

export function ApiDeleteUsersService() {
  return applyDecorators(
    ApiOperation({
      summary: 'Delete user service',
      description: 'Permanently removes a user service assignment',
    }),
    UuidParam(),
    ApiResponse({
      status: 200,
      description: 'User service successfully deleted',
    }),
    ApiResponse({ status: 404, description: 'User service not found' }),
  );
}
