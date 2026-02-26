import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateClientDto {
  @ApiProperty({ example: 'jan@example.com' })
  @IsNotEmpty()
  @IsEmail()
  readonly email: string;

  @ApiProperty({ example: 'Password123!' })
  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  readonly password: string;

  @ApiProperty({ example: 'Jan', required: false })
  @IsString()
  @IsOptional()
  readonly firstName?: string;

  @ApiProperty({ example: 'Kowalski', required: false })
  @IsString()
  @IsOptional()
  readonly lastName?: string;

  @ApiProperty({ example: '500600700', required: false })
  @IsString()
  @IsOptional()
  readonly phone?: string;

  @ApiProperty({ example: 'Alergia na lakier', required: false })
  @IsString()
  @IsOptional()
  readonly notes?: string;

  @ApiProperty({ example: false, required: false })
  @IsBoolean()
  @IsOptional()
  readonly marketingConsent?: boolean;
}
