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

export class CreateAppointmentDto {
  @ApiProperty({ example: 'uuid-user-service' })
  @IsNotEmpty()
  @IsUUID()
  userServiceId: string;

  @ApiProperty({ example: '2026-03-01T10:00:00.000Z' })
  @IsNotEmpty()
  @IsDateString()
  @HasTimeZone()
  scheduledAt: string;

  @ApiProperty({
    example: 'Jan Kowalski',
    required: false,
    description: 'Imię i nazwisko klienta bez konta',
  })
  @IsOptional()
  @IsString()
  @Length(1, 200)
  clientName?: string;

  @ApiProperty({
    example: 'jan@example.com',
    required: false,
    description:
      'Wymagany, jeśli rezerwacja nie jest powiązana z kontem klienta',
  })
  @IsOptional()
  @IsEmail()
  clientEmail?: string;

  @ApiProperty({ example: '500600700', required: false })
  @IsOptional()
  @IsString()
  clientPhone?: string;

  @ApiProperty({ example: 'Proszę o kontakt telefoniczny', required: false })
  @IsOptional()
  @IsString()
  @Length(0, 200)
  note?: string;
}
