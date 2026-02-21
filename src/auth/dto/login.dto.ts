import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
    @ApiProperty({
        description: 'User email address',
        example: 'user@example.com',
    })
    @IsEmail()
    @IsNotEmpty()
    username: string;

    @ApiProperty({
        description: 'User password',
        example: 'Password123',
    })
    @IsString()
    @IsNotEmpty()
    password: string;
}