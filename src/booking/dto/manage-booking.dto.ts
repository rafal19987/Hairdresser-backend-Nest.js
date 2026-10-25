import {
  IsDateString,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { HasTimeZone } from '@/appointment/validators/has-time-zone.validator';
import { DATE_PATTERN } from '@/salon/dto/save-special-day.dto';

export class CancelManagedAppointmentDto {
  @ApiProperty({ example: 'Zmiana planów', required: false })
  @IsOptional()
  @IsString()
  @Length(0, 200)
  reason?: string;
}

export class RescheduleManagedAppointmentDto {
  @ApiProperty({
    example: '2026-11-03T09:00:00.000Z',
    description: 'startsAt z listy wolnych slotów tego samego pracownika',
  })
  @IsNotEmpty()
  @IsDateString()
  @HasTimeZone()
  startsAt: string;
}

export class RescheduleSlotsQueryDto {
  @ApiProperty({
    example: '2026-11-02',
    description: 'Dzień w strefie czasowej salonu',
  })
  @IsNotEmpty()
  @Matches(DATE_PATTERN, { message: 'date musi mieć format YYYY-MM-DD' })
  @IsDateString({ strict: true })
  date: string;
}

export class SendManageLinkDto {
  @ApiProperty({ example: 'jan@example.com' })
  @IsNotEmpty()
  @IsEmail()
  email: string;
}
