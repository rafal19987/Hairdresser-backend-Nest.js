import { IsDateString, IsOptional, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { DATE_PATTERN } from '@/salon/dto/save-special-day.dto';

export class SpecialDaysQueryDto {
  @ApiProperty({
    example: '2026-12-01',
    required: false,
    description: 'Domyślnie dzisiejsza data w strefie czasowej salonu',
  })
  @IsOptional()
  @Matches(DATE_PATTERN, { message: 'from musi mieć format YYYY-MM-DD' })
  @IsDateString({ strict: true })
  from?: string;

  @ApiProperty({ example: '2026-12-31', required: false })
  @IsOptional()
  @Matches(DATE_PATTERN, { message: 'to musi mieć format YYYY-MM-DD' })
  @IsDateString({ strict: true })
  to?: string;
}
