import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { UpdateSalonDto } from '@/salon/dto/update-salon.dto';
import { ReplaceOpeningHoursDto } from '@/salon/dto/replace-opening-hours.dto';
import { SaveSpecialDayDto } from '@/salon/dto/save-special-day.dto';

const UuidParam = () =>
  ApiParam({
    name: 'uuid',
    description: 'Special day UUID',
    type: String,
    example: '123e4567-e89b-12d3-a456-426614174000',
  });

const ProtectedRoute = () =>
  applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 403, description: 'Missing settings permission' }),
  );

export function ApiGetSalon() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get salon settings',
      description:
        'Public endpoint. Returns salon details, booking rules, weekly opening hours and upcoming special days.',
    }),
    ApiResponse({ status: 200, description: 'Salon settings retrieved' }),
    ApiResponse({ status: 404, description: 'Salon is not configured' }),
  );
}

export function ApiUpdateSalon() {
  return applyDecorators(
    ApiOperation({ summary: 'Update salon details and booking rules' }),
    ApiBody({ type: UpdateSalonDto }),
    ProtectedRoute(),
    ApiResponse({ status: 200, description: 'Salon updated' }),
    ApiResponse({ status: 400, description: 'Validation error' }),
  );
}

export function ApiReplaceOpeningHours() {
  return applyDecorators(
    ApiOperation({
      summary: 'Replace weekly opening hours',
      description:
        'Replaces the whole week. Several ranges per day are allowed (e.g. lunch break); a day without ranges is closed. Times are in the salon time zone.',
    }),
    ApiBody({ type: ReplaceOpeningHoursDto }),
    ProtectedRoute(),
    ApiResponse({ status: 200, description: 'Opening hours updated' }),
    ApiResponse({
      status: 400,
      description:
        'Invalid format, closing before opening or overlapping ranges',
    }),
  );
}

export function ApiFindSpecialDays() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get special days',
      description:
        'Public endpoint. Holidays and days with changed opening hours, from today by default.',
    }),
    ApiQuery({ name: 'from', required: false, example: '2026-12-01' }),
    ApiQuery({ name: 'to', required: false, example: '2026-12-31' }),
    ApiResponse({ status: 200, description: 'Special days retrieved' }),
    ApiResponse({ status: 400, description: 'Invalid date range' }),
  );
}

export function ApiCreateSpecialDay() {
  return applyDecorators(
    ApiOperation({
      summary: 'Create special day',
      description:
        'Overrides weekly opening hours on a given date: either closed or open with its own hours.',
    }),
    ApiBody({ type: SaveSpecialDayDto }),
    ProtectedRoute(),
    ApiResponse({ status: 201, description: 'Special day created' }),
    ApiResponse({ status: 400, description: 'Invalid hours' }),
    ApiResponse({
      status: 409,
      description: 'Special day for this date already exists',
    }),
  );
}

export function ApiUpdateSpecialDay() {
  return applyDecorators(
    ApiOperation({ summary: 'Update special day' }),
    UuidParam(),
    ApiBody({ type: SaveSpecialDayDto }),
    ProtectedRoute(),
    ApiResponse({ status: 200, description: 'Special day updated' }),
    ApiResponse({ status: 400, description: 'Invalid hours' }),
    ApiResponse({ status: 404, description: 'Special day not found' }),
    ApiResponse({
      status: 409,
      description: 'Special day for this date already exists',
    }),
  );
}

export function ApiDeleteSpecialDay() {
  return applyDecorators(
    ApiOperation({ summary: 'Delete special day' }),
    UuidParam(),
    ProtectedRoute(),
    ApiResponse({ status: 200, description: 'Special day deleted' }),
    ApiResponse({ status: 404, description: 'Special day not found' }),
  );
}
