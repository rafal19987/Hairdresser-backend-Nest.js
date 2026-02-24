import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsUUID,
  Min,
} from 'class-validator';

export class CreateUsersServicesDto {
  @ApiProperty({
    description: 'User UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty()
  @IsUUID()
  readonly userUuid: string;

  @ApiProperty({
    description: 'Service UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty()
  @IsUUID()
  readonly serviceUuid: string;

  @ApiProperty({
    description: 'Price of service for this employee',
    example: 80.0,
  })
  @IsNumber()
  @Min(0)
  readonly price: number;

  @ApiProperty({
    description: 'Duration of service in minutes',
    example: 45,
  })
  @IsNumber()
  @Min(1)
  readonly duration: number;

  @ApiProperty({
    description: 'Whether the assignment is active',
    example: true,
    required: false,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  readonly active?: boolean;
}
