import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';

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
