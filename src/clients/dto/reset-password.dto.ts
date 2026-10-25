import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({ description: 'Token z linku w wiadomości email' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  readonly token: string;

  @ApiProperty({ example: 'NoweHaslo123!' })
  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  readonly password: string;
}
