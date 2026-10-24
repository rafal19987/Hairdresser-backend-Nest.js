import { ConflictException } from '@nestjs/common';

export class ServiceHasUpcomingAppointmentsException extends ConflictException {
  constructor(count: number) {
    super(
      `Usługa jest zarezerwowana w nadchodzących wizytach klientów (${count}). Anuluj je przed dezaktywacją albo usunięciem usługi.`,
    );
  }
}
