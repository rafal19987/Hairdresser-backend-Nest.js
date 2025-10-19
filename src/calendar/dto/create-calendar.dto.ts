import {
  IsNotEmpty,
  IsOptional,
  Length,
  Matches,
  IsBoolean,
  IsUUID,
} from 'class-validator';

export class CreateCalendarDto {
  @IsNotEmpty({ message: 'Nazwa kalendarza jest wymagana' })
  @Length(1, 255, { message: 'Nazwa nie może być dłuższa niż 255 znaków' })
  name: string;

  @IsNotEmpty({ message: 'Właściciel kalendarza jest wymagany' })
  @IsUUID()
  ownerId: string;

  @IsOptional()
  @Matches(/^#[0-9A-Fa-f]{6}$/, {
    message: 'Kolor musi być w formacie HEX, np. #FF5733',
  })
  color?: string;

  @IsOptional()
  @Length(0, 500, { message: 'Opis nie może być dłuższy niż 500 znaków' })
  description?: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
