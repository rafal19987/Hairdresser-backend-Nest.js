import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiParam, ApiBody, ApiQuery } from '@nestjs/swagger';
import { CreateRoleDto } from '@/roles/dto/create-role.dto';
import { PaginatedResultDto } from '@/common/dto/paginated-result.dto';

export function ApiFindAllRoles() {
    return applyDecorators(
        ApiOperation({ summary: 'Get all roles', description: 'Retrieves a paginated list of all active roles' }),
        ApiQuery({ name: 'page', required: false, type: Number, example: 1 }),
        ApiQuery({ name: 'limit', required: false, type: Number, example: 10 }),
        ApiResponse({ status: 200, description: 'List of roles retrieved successfully', type: PaginatedResultDto }),
        ApiResponse({ status: 404, description: 'No roles found' }),
    );
}

export function ApiCreateRole() {
    return applyDecorators(
        ApiOperation({ summary: 'Create role', description: 'Creates a new role' }),
        ApiBody({ type: CreateRoleDto }),
        ApiResponse({ status: 201, description: 'Role created successfully' }),
        ApiResponse({ status: 400, description: 'Bad request - Invalid data' }),
        ApiResponse({ status: 409, description: 'Role already exists' }),
    );
}

export function ApiGetRoleById() {
    return applyDecorators(
        ApiOperation({ summary: 'Get role by ID' }),
        ApiParam({ name: 'id', description: 'Role UUID', type: String }),
        ApiResponse({ status: 200, description: 'Role found successfully' }),
        ApiResponse({ status: 404, description: 'Role not found' }),
    );
}