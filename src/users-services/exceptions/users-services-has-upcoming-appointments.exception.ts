import { ConflictException } from '@nestjs/common';

export class UsersServicesHasUpcomingAppointmentsException extends ConflictException {
  constructor(count: number) {
    super(
      `Pracownik ma nadchodzące wizyty klientów na tę usługę (${count}). Anuluj je przed dezaktywacją albo usunięciem przypisania.`,
    );
  }
}
