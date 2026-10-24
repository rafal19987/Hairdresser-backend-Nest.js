import { IsNotEmpty, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TIME_PATTERN } from '@/salon/helpers/time.helper';

export class TimeRangeDto {
  @ApiProperty({ example: '09:00' })
  @IsNotEmpty()
  @Matches(TIME_PATTERN, { message: 'opensAt musi mieć format HH:mm' })
  opensAt: string;

  @ApiProperty({ example: '18:00' })
  @IsNotEmpty()
  @Matches(TIME_PATTERN, { message: 'closesAt musi mieć format HH:mm' })
  closesAt: string;
}
