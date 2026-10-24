import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';

export function ApiFindAvailableSlots() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get available booking slots for a day',
      description:
        'Public endpoint. Returns start times within salon opening hours that respect client booking rules (lead time, booking horizon). Without employeeId every employee offering the service is considered and each slot lists who is free.',
    }),
    ApiQuery({ name: 'serviceId', required: true }),
    ApiQuery({ name: 'date', required: true, example: '2026-11-02' }),
    ApiQuery({ name: 'employeeId', required: false }),
    ApiResponse({ status: 200, description: 'Available slots retrieved' }),
    ApiResponse({ status: 400, description: 'Invalid query parameters' }),
    ApiResponse({
      status: 404,
      description:
        'Service not found or selected employee does not offer the service',
    }),
  );
}

export function ApiFindBookableEmployees() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get employees that can be booked for a service',
      description:
        'Public endpoint. Same employees that available slots consider, with their price and duration. userServiceId matches the ids returned by available slots.',
    }),
    ApiParam({ name: 'serviceId', type: String }),
    ApiResponse({ status: 200, description: 'Bookable employees retrieved' }),
    ApiResponse({ status: 400, description: 'Invalid service id' }),
    ApiResponse({ status: 404, description: 'Service not found' }),
  );
}

export function ApiFindBookableServices() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get services that can be booked',
      description:
        'Public endpoint. Active services offered by at least one bookable employee, with price and duration ranges across employees.',
    }),
    ApiResponse({ status: 200, description: 'Bookable services retrieved' }),
  );
}
