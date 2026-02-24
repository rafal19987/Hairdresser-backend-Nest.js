import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsOptional, Min } from 'class-validator';

export class UpdateUsersServicesDto {
  @ApiProperty({
    description: 'Price of service for this employee',
    example: 80.0,
    required: false,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  readonly price?: number;

  @ApiProperty({
    description: 'Duration of service in minutes',
    example: 45,
    required: false,
  })
  @IsNumber()
  @Min(1)
  @IsOptional()
  readonly duration?: number;

  @ApiProperty({
    description: 'Whether the assignment is active',
    example: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  readonly active?: boolean;
}
