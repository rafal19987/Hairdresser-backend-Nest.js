import { ConflictException } from '@nestjs/common';

export class UserHasUpcomingAppointmentsException extends ConflictException {
  constructor(count: number) {
    super(
      `Pracownik ma nadchodzące wizyty klientów (${count}). Anuluj je przed dezaktywacją albo usunięciem konta.`,
    );
  }
}
