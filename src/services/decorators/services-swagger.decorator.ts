import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiParam, ApiBody, ApiQuery } from '@nestjs/swagger';
import { CreateServiceDto } from '@/services/dto/create-service.dto';
import { EditServiceDto } from '@/services/dto/edit-service.dto';
import { PaginatedResultDto } from '@/common/dto/paginated-result.dto';

const IdParam = () => ApiParam({ name: 'id', description: 'Service id', type: Number, example: 1 });

const PaginationQuery = () => applyDecorators(
    ApiQuery({ name: 'page', required: false, type: Number, example: 1 }),
    ApiQuery({ name: 'limit', required: false, type: Number, example: 10 }),
);

export function ApiFindAllServices() {
    return applyDecorators(
        ApiOperation({ summary: 'Get all services', description: 'Retrieves a paginated list of all active services' }),
        PaginationQuery(),
        ApiResponse({ status: 200, description: 'List of services retrieved successfully', type: PaginatedResultDto }),
        ApiResponse({ status: 404, description: 'No services found' }),
    );
}

export function ApiFindDeletedServices() {
    return applyDecorators(
        ApiOperation({ summary: 'Get deleted services', description: 'Retrieves a paginated list of all deleted services' }),
        PaginationQuery(),
        ApiResponse({ status: 200, description: 'List of deleted services retrieved successfully', type: PaginatedResultDto }),
        ApiResponse({ status: 404, description: 'No deleted services found' }),
    );
}

export function ApiFindOneService() {
    return applyDecorators(
        ApiOperation({ summary: 'Get service by id' }),
        IdParam(),
        ApiResponse({ status: 200, description: 'Service found successfully' }),
        ApiResponse({ status: 404, description: 'Service not found' }),
    );
}

export function ApiCreateService() {
    return applyDecorators(
        ApiOperation({ summary: 'Create service', description: 'Creates a new service' }),
        ApiBody({ type: CreateServiceDto }),
        ApiResponse({ status: 201, description: 'Service created successfully' }),
        ApiResponse({ status: 400, description: 'Bad request - Invalid data' }),
        ApiResponse({ status: 409, description: 'Service with this name already exists' }),
    );
}

export function ApiUpdateService() {
    return applyDecorators(
        ApiOperation({ summary: 'Update service', description: 'Updates an existing service' }),
        IdParam(),
        ApiBody({ type: EditServiceDto }),
        ApiResponse({ status: 200, description: 'Service updated successfully' }),
        ApiResponse({ status: 400, description: 'Bad request - Invalid data' }),
        ApiResponse({ status: 404, description: 'Service not found' }),
    );
}

export function ApiSoftDeleteService() {
    return applyDecorators(
        ApiOperation({ summary: 'Soft delete service' }),
        IdParam(),
        ApiResponse({ status: 202, description: 'Service soft deleted successfully' }),
        ApiResponse({ status: 404, description: 'Service not found' }),
    );
}

export function ApiDeleteService() {
    return applyDecorators(
        ApiOperation({ summary: 'Permanently delete service' }),
        IdParam(),
        ApiResponse({ status: 200, description: 'Service permanently deleted successfully' }),
        ApiResponse({ status: 404, description: 'Service not found' }),
    );
}

export function ApiRestoreService() {
    return applyDecorators(
        ApiOperation({ summary: 'Restore deleted service' }),
        IdParam(),
        ApiResponse({ status: 200, description: 'Service restored successfully' }),
        ApiResponse({ status: 400, description: 'Service is not deleted' }),
        ApiResponse({ status: 404, description: 'Service not found' }),
    );
}