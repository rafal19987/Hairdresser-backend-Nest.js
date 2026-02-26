import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Length,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IsAfter } from '@/appointment/validators/date-range.validator';

export class CreateInternalAppointmentDto {
  @ApiProperty({ example: 'uuid-kalendarza' })
  @IsNotEmpty()
  @IsUUID()
  calendarId: string;

  @ApiProperty({ example: 'uuid-pracownika' })
  @IsNotEmpty()
  @IsUUID()
  ownerId: string;

  @ApiProperty({ example: 'Spotkanie z dostawcą' })
  @IsNotEmpty()
  @IsString()
  @Length(1, 255)
  name: string;

  @ApiProperty({ example: 'uuid-user-service', required: false })
  @IsOptional()
  @IsUUID()
  userServiceId?: string;

  @ApiProperty({ example: 'uuid-klienta', required: false })
  @IsOptional()
  @IsUUID()
  clientId?: string;

  @ApiProperty({
    example: 60,
    required: false,
    description: 'Czas trwania w minutach',
  })
  @IsOptional()
  @IsInt()
  @IsPositive()
  duration?: number;

  @ApiProperty({ example: '2026-03-01T10:00:00.000Z' })
  @IsNotEmpty()
  @IsDateString()
  scheduledAt: string;

  @ApiProperty({ example: '2026-03-01T11:00:00.000Z' })
  @IsNotEmpty()
  @IsDateString()
  @IsAfter('scheduledAt', {
    message: 'Data zakończenia musi być późniejsza niż data rozpoczęcia',
  })
  scheduledEndAt: string;

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
}
