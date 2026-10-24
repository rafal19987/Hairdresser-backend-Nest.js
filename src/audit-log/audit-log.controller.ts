import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthenticationGuard } from '@/guards/authentication.guard';
import { AuthorizationGuard } from '@/guards/authorization.guard';
import { Permissions } from '@/decorators/permissions.decorator';
import { Action } from '@/roles/enums/action.enum';
import { Resource } from '@/roles/enums/resource.enum';
import { ResponseDto } from '@/common/dto/response.dto';
import { PaginatedResultDto } from '@/common/dto/paginated-result.dto';
import { AuditLogService } from '@/audit-log/audit-log.service';
import { AuditLog } from '@/audit-log/entities/audit-log.entity';
import { AuditLogQueryDto } from '@/audit-log/dto/audit-log-query.dto';
import {
  ApiFindAuditLogs,
  ApiFindOneAuditLog,
} from '@/audit-log/decorators/audit-log-swagger.decorator';

@ApiTags('Audit logs')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthenticationGuard, AuthorizationGuard)
@Permissions([{ resource: Resource.AUDIT_LOGS, actions: [Action.READ] }])
@Controller('audit-logs')
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @ApiFindAuditLogs()
  @Get()
  async findAll(
    @Query() query: AuditLogQueryDto,
  ): Promise<PaginatedResultDto<AuditLog>> {
    return await this.auditLogService.findAll(query);
  }

  @ApiFindOneAuditLog()
  @Get(':uuid')
  async findOne(
    @Param('uuid', ParseUUIDPipe) uuid: string,
  ): Promise<ResponseDto> {
    return await this.auditLogService.findOne(uuid);
  }
}
