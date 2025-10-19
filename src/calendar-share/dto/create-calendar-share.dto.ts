import {
  IsNotEmpty,
  IsOptional,
  IsIn,
  IsEmail,
  IsUUID,
  IsBoolean,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCalendarShareDto {
  @ApiProperty({
    description: 'UUID kalendarza do udostępnienia',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: true,
  })
  @IsNotEmpty({ message: 'Kalendarz jest wymagany' })
  @IsUUID()
  calendarId: string;

  @ApiProperty({
    description: 'UUID użytkownika, któremu udostępniamy kalendarz',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  sharedWithUserId?: string;

  @ApiProperty({
    description:
      'Email użytkownika, któremu udostępniamy kalendarz (alternatywa dla UUID)',
    example: 'user@example.com',
    required: false,
  })
  @IsOptional()
  @IsEmail({}, { message: 'Podaj poprawny adres e-mail' })
  sharedWithEmail?: string;

  @ApiProperty({
    description: 'Poziom uprawnień',
    enum: ['read', 'create', 'write', 'full'],
    example: 'read',
    required: true,
  })
  @IsNotEmpty({ message: 'Poziom uprawnień jest wymagany' })
  @IsIn(['read', 'create', 'write', 'full'], {
    message: 'Dozwolone poziomy uprawnień: read, create, write, full',
  })
  permission: 'read' | 'create' | 'write' | 'full';

  @ApiProperty({
    description: 'Czy udostępnienie jest aktywne',
    example: true,
    required: false,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
