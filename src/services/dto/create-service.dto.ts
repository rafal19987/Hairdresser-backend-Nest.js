import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateServiceDto {
  @ApiProperty({
    description: 'Service name',
    example: 'cut hair',
    required: true,
  })
  @IsNotEmpty()
  readonly name: string;

  @ApiProperty({
    description: 'Descirption of service',
    example: 'Description',
    required: true,
    minLength: 8,
    maxLength: 50,
  })
  @IsString()
  @MinLength(8)
  @MaxLength(50)
  readonly description: string;

  @ApiProperty({
    description: 'Whether the user account is active',
    example: true,
    required: false,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  readonly active?: boolean;
}
