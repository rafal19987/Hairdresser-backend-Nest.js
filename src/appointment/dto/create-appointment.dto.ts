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

export class CreateAppointmentDto {
  @ApiProperty({ example: 'uuid-user-service' })
  @IsNotEmpty()
  @IsUUID()
  userServiceId: string;

  @ApiProperty({ example: '2026-03-01T10:00:00.000Z' })
  @IsNotEmpty()
  @IsDateString()
  scheduledAt: string;

  @ApiProperty({ example: 'jan@example.com', required: false })
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
