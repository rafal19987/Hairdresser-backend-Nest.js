import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsUUID,
} from 'class-validator';
import { HasTimeZone } from '@/appointment/validators/has-time-zone.validator';

export const MAX_RANGE_DAYS = 45;
export const MAX_RANGE_CALENDARS = 50;

export class AppointmentsRangeQueryDto {
  @ApiProperty({ example: '2026-10-26T00:00:00.000Z' })
  @IsNotEmpty()
  @IsDateString()
  @HasTimeZone()
  from: string;

  @ApiProperty({
    example: '2026-11-02T00:00:00.000Z',
    description: `Koniec zakresu (wyłącznie), maksymalnie ${MAX_RANGE_DAYS} dni od początku`,
  })
  @IsNotEmpty()
  @IsDateString()
  @HasTimeZone()
  to: string;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'UUID kalendarzy oddzielone przecinkami',
    type: String,
  })
  @Transform(({ value }) =>
    (Array.isArray(value) ? value : String(value).split(','))
      .map((uuid: string) => uuid.trim())
      .filter(Boolean),
  )
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_RANGE_CALENDARS)
  @IsUUID('all', { each: true })
  calendarIds: string[];
}
