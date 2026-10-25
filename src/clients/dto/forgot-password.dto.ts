import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class ForgotPasswordDto {
  @ApiProperty({ example: 'jan@example.com' })
  @IsNotEmpty()
  @IsEmail()
  readonly email: string;
}
