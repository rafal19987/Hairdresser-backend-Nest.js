import {
  IsDateString,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Length,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { HasTimeZone } from '@/appointment/validators/has-time-zone.validator';

export class CreateClientBookingDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'userServiceId z listy wolnych slotów',
  })
  @IsNotEmpty()
  @IsUUID()
  userServiceId: string;

  @ApiProperty({
    example: '2026-11-02T08:00:00.000Z',
    description: 'startsAt z listy wolnych slotów',
  })
  @IsNotEmpty()
  @IsDateString()
  @HasTimeZone()
  startsAt: string;

  @ApiProperty({
    example: 'Jan',
    required: false,
    description: 'Wymagane bez logowania',
  })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  firstName?: string;

  @ApiProperty({ example: 'Kowalski', required: false })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  lastName?: string;

  @ApiProperty({
    example: 'jan@example.com',
    required: false,
    description: 'Wymagany bez logowania',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: '+48 500 600 700', required: false })
  @IsOptional()
  @IsString()
  @Length(1, 30)
  phone?: string;

  @ApiProperty({ example: 'Proszę o krótkie cięcie', required: false })
  @IsOptional()
  @IsString()
  @Length(0, 200)
  note?: string;
}
