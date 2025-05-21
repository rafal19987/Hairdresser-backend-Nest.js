import {
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class EditUserDto {
  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
    required: false,
  })
  @IsEmail()
  @IsOptional()
  readonly email?: string;

  @ApiProperty({
    description: 'User first name',
    example: 'John',
    required: false,
  })
  @IsString()
  @IsOptional()
  readonly firstName?: string;

  @ApiProperty({
    description: 'User last name',
    example: 'Doe',
    required: false,
  })
  @IsString()
  @IsOptional()
  readonly lastName?: string;

  @ApiProperty({
    description: 'Whether the user account is active',
    example: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  readonly active?: boolean;

  @ApiProperty({
    description: 'UUID of the role assigned to the user',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  role?: string;
}
