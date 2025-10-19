import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateCalendarShareDto } from './create-calendar-share.dto';

export class UpdateCalendarShareDto extends PartialType(
  OmitType(CreateCalendarShareDto, [
    'calendarId',
    'sharedWithUserId',
    'sharedWithEmail',
  ] as const),
) {}
