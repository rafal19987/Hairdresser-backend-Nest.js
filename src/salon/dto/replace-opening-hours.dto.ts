import { IsArray, IsInt, Max, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { TimeRangeDto } from '@/salon/dto/time-range.dto';

export class OpeningHoursEntryDto extends TimeRangeDto {
  @ApiProperty({ example: 1, description: '1 = poniedziałek, 7 = niedziela' })
  @IsInt()
  @Min(1)
  @Max(7)
  dayOfWeek: number;
}

export class ReplaceOpeningHoursDto {
  @ApiProperty({
    type: [OpeningHoursEntryDto],
    description:
      'Pełny grafik tygodniowy. Dzień bez przedziałów oznacza, że salon jest zamknięty.',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OpeningHoursEntryDto)
  hours: OpeningHoursEntryDto[];
}
