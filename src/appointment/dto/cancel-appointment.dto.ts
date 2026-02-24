import { IsEnum, IsOptional, IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CancelledBy } from '@/appointment/enums/appointment-cancelled-by.enum';

export class CancelAppointmentDto {
  @ApiProperty({ enum: CancelledBy })
  @IsEnum(CancelledBy)
  cancelledBy: CancelledBy;

  @ApiProperty({ example: 'Zmiana planów', required: false })
  @IsOptional()
  @IsString()
  @Length(0, 200)
  cancellationReason?: string;
}
