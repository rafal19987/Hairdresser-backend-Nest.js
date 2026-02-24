import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  Length,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AppointmentStatus } from '@/appointment/enums/appointment-status.enum';
import { IsAfter } from '@/appointment/validators/date-range.validator';

export class UpdateAppointmentDto {
  @ApiProperty({ example: 'Nowa nazwa', required: false })
  @IsOptional()
  @IsString()
  @Length(1, 255)
  name?: string;

  @ApiProperty({ enum: AppointmentStatus, required: false })
  @IsOptional()
  @IsEnum(AppointmentStatus)
  status?: AppointmentStatus;

  @ApiProperty({ example: 60, required: false })
  @IsOptional()
  @IsInt()
  @IsPositive()
  duration?: number;

  @ApiProperty({ example: 'Notatka', required: false })
  @IsOptional()
  @IsString()
  @Length(0, 200)
  note?: string;

  @ApiProperty({ example: 'https://meet.google.com/xyz', required: false })
  @IsOptional()
  @IsString()
  meetingLink?: string;

  @ApiProperty({ example: 'ul. Kwiatowa 1, Warszawa', required: false })
  @IsOptional()
  @IsString()
  eventLocalization?: string;

  @ApiProperty({ example: '2026-03-01T10:00:00.000Z', required: false })
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @ApiProperty({ example: '2026-03-01T11:00:00.000Z', required: false })
  @IsOptional()
  @IsDateString()
  @IsAfter('scheduledAt', {
    message: 'Data zakończenia musi być późniejsza niż data rozpoczęcia',
  })
  scheduledEndAt?: string;
}
