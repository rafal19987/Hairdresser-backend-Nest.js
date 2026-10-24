import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { TimeRangeDto } from '@/salon/dto/time-range.dto';

export const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export class SaveSpecialDayDto {
  @ApiProperty({ example: '2026-12-24' })
  @IsNotEmpty()
  @Matches(DATE_PATTERN, { message: 'date musi mieć format YYYY-MM-DD' })
  @IsDateString({ strict: true })
  date: string;

  @ApiProperty({ example: 'Wigilia', required: false, nullable: true })
  @IsOptional()
  @IsString()
  @Length(0, 100)
  name?: string | null;

  @ApiProperty({ example: false })
  @IsBoolean()
  isClosed: boolean;

  @ApiProperty({
    type: [TimeRangeDto],
    required: false,
    description: 'Godziny otwarcia tego dnia, wymagane gdy salon jest otwarty',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TimeRangeDto)
  hours?: TimeRangeDto[];
}
