import { ForbiddenException } from '@nestjs/common';

export class CalendarSharePermissionException extends ForbiddenException {
  constructor(message?: string) {
    super(message || 'Brak uprawnień do wykonania tej operacji na kalendarzu');
  }
}
