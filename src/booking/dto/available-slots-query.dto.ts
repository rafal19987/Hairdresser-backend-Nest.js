import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { DATE_PATTERN } from '@/salon/dto/save-special-day.dto';

export class AvailableSlotsQueryDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsNotEmpty()
  @IsUUID()
  serviceId: string;

  @ApiProperty({
    example: '2026-11-02',
    description: 'Dzień w strefie czasowej salonu',
  })
  @IsNotEmpty()
  @Matches(DATE_PATTERN, { message: 'date musi mieć format YYYY-MM-DD' })
  @IsDateString({ strict: true })
  date: string;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
    description:
      'Pracownik; bez tego parametru zwracane są sloty wszystkich pracowników',
  })
  @IsOptional()
  @IsUUID()
  employeeId?: string;
}
