import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiParam, ApiBody, ApiQuery } from '@nestjs/swagger';
import { CreateUserDto } from '@/users/dto/create-user.dto';
import { EditUserDto } from '@/users/dto/edit-user.dto';
import { PaginatedResultDto } from '@/common/dto/paginated-result.dto';

const UuidParam = () => ApiParam({
    name: 'uuid',
    description: 'User UUID',
    type: String,
    example: '123e4567-e89b-12d3-a456-426614174000',
});

const PaginationQuery = () => applyDecorators(
    ApiQuery({ name: 'page', required: false, type: Number, example: 1 }),
    ApiQuery({ name: 'limit', required: false, type: Number, example: 10 }),
);

export function ApiFindAllUsers() {
    return applyDecorators(
        ApiOperation({ summary: 'Get all users', description: 'Retrieves a paginated list of all active users' }),
        PaginationQuery(),
        ApiResponse({ status: 200, description: 'List of users retrieved successfully', type: PaginatedResultDto }),
        ApiResponse({ status: 404, description: 'No users found' }),
    );
}

export function ApiFindDeletedUsers() {
    return applyDecorators(
        ApiOperation({ summary: 'Get deleted users', description: 'Retrieves a paginated list of all deleted users' }),
        PaginationQuery(),
        ApiResponse({ status: 200, description: 'List of deleted users retrieved successfully', type: PaginatedResultDto }),
        ApiResponse({ status: 404, description: 'No deleted users found' }),
    );
}

export function ApiFindOneUser() {
    return applyDecorators(
        ApiOperation({ summary: 'Get user by UUID' }),
        UuidParam(),
        ApiResponse({ status: 200, description: 'User found successfully' }),
        ApiResponse({ status: 404, description: 'User not found' }),
    );
}

export function ApiCreateUser() {
    return applyDecorators(
        ApiOperation({ summary: 'Create user', description: 'Creates a new user' }),
        ApiBody({ type: CreateUserDto }),
        ApiResponse({ status: 201, description: 'User created successfully' }),
        ApiResponse({ status: 400, description: 'Bad request - Invalid data' }),
        ApiResponse({ status: 409, description: 'User with this email already exists' }),
    );
}

export function ApiUpdateUser() {
    return applyDecorators(
        ApiOperation({ summary: 'Update user', description: 'Updates an existing user' }),
        UuidParam(),
        ApiBody({ type: EditUserDto }),
        ApiResponse({ status: 200, description: 'User updated successfully' }),
        ApiResponse({ status: 400, description: 'Bad request - Invalid data' }),
        ApiResponse({ status: 404, description: 'User not found' }),
    );
}

export function ApiSoftDeleteUser() {
    return applyDecorators(
        ApiOperation({ summary: 'Soft delete user', description: 'Marks a user as deleted without removing from database' }),
        UuidParam(),
        ApiResponse({ status: 202, description: 'User soft deleted successfully' }),
        ApiResponse({ status: 404, description: 'User not found' }),
    );
}

export function ApiDeleteUser() {
    return applyDecorators(
        ApiOperation({ summary: 'Permanently delete user', description: 'Permanently removes a user from the database' }),
        UuidParam(),
        ApiResponse({ status: 200, description: 'User permanently deleted successfully' }),
        ApiResponse({ status: 404, description: 'User not found' }),
    );
}

export function ApiRestoreUser() {
    return applyDecorators(
        ApiOperation({ summary: 'Restore deleted user', description: 'Restores a previously soft-deleted user' }),
        UuidParam(),
        ApiResponse({ status: 200, description: 'User restored successfully' }),
        ApiResponse({ status: 400, description: 'User is not deleted' }),
        ApiResponse({ status: 404, description: 'User not found' }),
    );
}