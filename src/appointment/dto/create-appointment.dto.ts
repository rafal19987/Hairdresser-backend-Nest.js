import {
  IsNotEmpty,
  IsOptional,
  IsEmail,
  IsUrl,
  IsPositive,
  Length,
  IsArray,
  IsUUID,
  IsDateString,
  ArrayUnique,
} from 'class-validator';
import { IsAfter } from '@/appointment/validators/date-range.validator';

export class CreateAppointmentDto {
  @IsNotEmpty({ message: 'Nazwa jest wymagana' })
  @Length(1, 255)
  name: string;

  @IsNotEmpty({ message: 'Właściciel jest wymagany' })
  @IsUUID()
  ownerId: string;

  @IsNotEmpty({ message: 'Kalendarz jest wymagany' })
  @IsUUID()
  calendarId: string;

  @IsNotEmpty({ message: 'Typ spotkania jest wymagany' })
  typeId: number;

  @IsOptional()
  meetingTypeId?: number;

  @IsOptional()
  @IsUrl({}, { message: 'Podaj poprawny adres URL' })
  meetingLink?: string;

  @IsOptional()
  meetingPhoneNumber?: string;

  @IsOptional()
  eventLocalization?: string;

  @IsOptional()
  @Length(0, 200, { message: 'Notatka nie może być dłuższa niż 200 znaków' })
  note?: string;

  @IsOptional()
  @IsArray()
  @IsEmail(
    {},
    { each: true, message: 'Każdy adres musi być poprawnym adresem e-mail' },
  )
  @ArrayUnique({ message: 'Adresy e-mail muszą być unikalne' })
  meetingEmailsToNotify?: string[];

  @IsNotEmpty({ message: 'Data rozpoczęcia jest wymagana' })
  @IsDateString()
  scheduledAt: string;

  @IsNotEmpty({ message: 'Data zakończenia jest wymagana' })
  @IsDateString()
  @IsAfter('scheduledAt', {
    message: 'Data zakończenia musi być późniejsza niż data rozpoczęcia',
  })
  scheduledEndAt: string;

  @IsOptional()
  @IsPositive({ message: 'Czas trwania musi być liczbą dodatnią' })
  meetingDuration?: number;
}
