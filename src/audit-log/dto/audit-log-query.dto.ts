import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { PaginationParamsDto } from '@/common/dto/pagination-params.dto';
import { AuditActorType } from '@/audit-log/enums/audit-actor-type.enum';
import { HasTimeZone } from '@/appointment/validators/has-time-zone.validator';

export class AuditLogQueryDto extends PaginationParamsDto {
  @ApiProperty({ required: false, maximum: 100, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @Max(100)
  limit?: number = 20;

  @ApiProperty({ example: 'appointment.cancelled', required: false })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  action?: string;

  @ApiProperty({ example: 'appointment', required: false })
  @IsOptional()
  @IsString()
  @Length(1, 50)
  entityType?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  entityId?: string;

  @ApiProperty({ enum: AuditActorType, required: false })
  @IsOptional()
  @IsEnum(AuditActorType)
  actorType?: AuditActorType;

  @ApiProperty({ example: '2026-10-01T00:00:00.000Z', required: false })
  @IsOptional()
  @IsDateString()
  @HasTimeZone()
  from?: string;

  @ApiProperty({ example: '2026-10-31T23:59:59.999Z', required: false })
  @IsOptional()
  @IsDateString()
  @HasTimeZone()
  to?: string;
}
