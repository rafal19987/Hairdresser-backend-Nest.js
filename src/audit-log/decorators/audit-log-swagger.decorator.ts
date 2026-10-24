import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { PaginatedResultDto } from '@/common/dto/paginated-result.dto';

const Protected = () =>
  applyDecorators(
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 403, description: 'Missing audit-logs permission' }),
  );

export function ApiFindAuditLogs() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get audit log entries',
      description:
        'Newest first. Filter by action, entity, actor type and date range; query searches actor label and entity id.',
    }),
    ApiResponse({
      status: 200,
      description: 'Audit entries retrieved',
      type: PaginatedResultDto,
    }),
    ApiResponse({ status: 400, description: 'Invalid filters' }),
    Protected(),
  );
}

export function ApiFindOneAuditLog() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get audit log entry',
      description:
        'Includes a summary of the current state of the logged object when available.',
    }),
    ApiParam({ name: 'uuid', type: String }),
    ApiResponse({ status: 200, description: 'Audit entry retrieved' }),
    ApiResponse({ status: 404, description: 'Audit entry not found' }),
    Protected(),
  );
}
