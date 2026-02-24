import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ClientRefreshTokenDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly refreshToken: string;
}
