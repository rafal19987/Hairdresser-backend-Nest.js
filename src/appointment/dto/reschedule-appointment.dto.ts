import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IsAfter } from '@/appointment/validators/date-range.validator';
import { RescheduledBy } from '@/appointment/enums/appointment-rescheduled-by.enum';

export class RescheduleAppointmentDto {
  @ApiProperty({ example: '2026-03-05T10:00:00.000Z' })
  @IsNotEmpty()
  @IsDateString()
  scheduledAt: string;

  @ApiProperty({ example: '2026-03-05T11:00:00.000Z' })
  @IsNotEmpty()
  @IsDateString()
  @IsAfter('scheduledAt', {
    message: 'Data zakończenia musi być późniejsza niż data rozpoczęcia',
  })
  scheduledEndAt: string;

  @ApiProperty({ enum: RescheduledBy })
  @IsNotEmpty()
  @IsEnum(RescheduledBy)
  rescheduledBy: RescheduledBy;

  @ApiProperty({ example: 'Prośba klienta', required: false })
  @IsOptional()
  @IsString()
  @Length(0, 200)
  note?: string;
}
