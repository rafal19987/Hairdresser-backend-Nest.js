import { applyDecorators } from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { CreateClientDto } from '@/clients/dto/create-client.dto';
import { UpdateClientDto } from '@/clients/dto/update-client.dto';
import { PaginatedResultDto } from '@/common/dto/paginated-result.dto';

const UuidParam = () =>
  ApiParam({
    name: 'uuid',
    description: 'Client UUID',
    type: String,
    example: '123e4567-e89b-12d3-a456-426614174000',
  });
const PaginationQuery = () =>
  applyDecorators(
    ApiQuery({ name: 'page', required: false, type: Number, example: 1 }),
    ApiQuery({ name: 'limit', required: false, type: Number, example: 10 }),
  );

export function ApiFindAllClients() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get all clients',
      description: 'Retrieves a paginated list of all clients',
    }),
    PaginationQuery(),
    ApiResponse({
      status: 200,
      description: 'List of clients retrieved successfully',
      type: PaginatedResultDto,
    }),
  );
}

export function ApiFindOneClient() {
  return applyDecorators(
    ApiOperation({ summary: 'Get client by UUID' }),
    UuidParam(),
    ApiResponse({ status: 200, description: 'Client found successfully' }),
    ApiResponse({ status: 404, description: 'Client not found' }),
  );
}

export function ApiCreateClient() {
  return applyDecorators(
    ApiOperation({
      summary: 'Register client',
      description: 'Registers a new client and sends verification email',
    }),
    ApiBody({ type: CreateClientDto }),
    ApiResponse({ status: 201, description: 'Client registered successfully' }),
    ApiResponse({ status: 409, description: 'Client already exists' }),
  );
}

export function ApiVerifyClientEmail() {
  return applyDecorators(
    ApiOperation({
      summary: 'Verify client email',
      description: 'Verifies client email using token from email',
    }),
    ApiParam({
      name: 'token',
      description: 'Email verification token',
      type: String,
    }),
    ApiResponse({ status: 200, description: 'Email verified successfully' }),
    ApiResponse({ status: 404, description: 'Invalid verification token' }),
  );
}

export function ApiUpdateClient() {
  return applyDecorators(
    ApiOperation({ summary: 'Update client' }),
    UuidParam(),
    ApiBody({ type: UpdateClientDto }),
    ApiResponse({ status: 200, description: 'Client updated successfully' }),
    ApiResponse({ status: 404, description: 'Client not found' }),
  );
}

export function ApiDeleteClient() {
  return applyDecorators(
    ApiOperation({ summary: 'Delete client' }),
    UuidParam(),
    ApiResponse({ status: 200, description: 'Client deleted successfully' }),
    ApiResponse({ status: 404, description: 'Client not found' }),
  );
}
