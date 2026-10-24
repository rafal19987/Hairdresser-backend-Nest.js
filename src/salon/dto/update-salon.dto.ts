import {
  IsBoolean,
  IsEmail,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsTimeZone,
  Length,
  Max,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export const SLOT_INTERVALS_MINUTES = [5, 10, 15, 20, 30, 60];

export class UpdateSalonDto {
  @ApiProperty({ example: 'Rêve', required: false })
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  @Length(1, 255)
  name?: string;

  @ApiProperty({ example: 'kontakt@reve.pl', required: false, nullable: true })
  @IsOptional()
  @IsEmail()
  email?: string | null;

  @ApiProperty({ example: '+48 600 000 000', required: false, nullable: true })
  @IsOptional()
  @IsString()
  @Length(0, 30)
  phone?: string | null;

  @ApiProperty({ example: 'Europe/Warsaw', required: false })
  @IsOptional()
  @IsTimeZone({
    message: 'timeZone musi być strefą czasową IANA, np. Europe/Warsaw',
  })
  timeZone?: string;

  @ApiProperty({
    example: 60,
    required: false,
    description: 'Minimalne wyprzedzenie rezerwacji klienta w minutach',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10080)
  clientMinLeadTimeMinutes?: number;

  @ApiProperty({
    example: 60,
    required: false,
    description: 'Na ile dni naprzód można rezerwować wizyty',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(365)
  maxBookingDaysAhead?: number;

  @ApiProperty({
    example: 15,
    required: false,
    enum: SLOT_INTERVALS_MINUTES,
    description: 'Odstęp między kolejnymi slotami rezerwacji w minutach',
  })
  @IsOptional()
  @IsIn(SLOT_INTERVALS_MINUTES)
  slotIntervalMinutes?: number;

  @ApiProperty({
    example: 24,
    required: false,
    description:
      'Do ilu godzin przed wizytą klient może ją anulować lub przełożyć',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(720)
  clientCancellationDeadlineHours?: number;

  @ApiProperty({
    example: false,
    required: false,
    description: 'Czy rezerwacje klientów są od razu potwierdzone',
  })
  @IsOptional()
  @IsBoolean()
  autoConfirmClientBookings?: boolean;
}
