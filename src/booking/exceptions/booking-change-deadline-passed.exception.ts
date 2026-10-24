import { ConflictException } from '@nestjs/common';

export class BookingChangeDeadlinePassedException extends ConflictException {
  constructor(deadlineHours: number) {
    super(
      `Wizytę można anulować lub przełożyć najpóźniej ${deadlineHours} godz. przed jej rozpoczęciem. Skontaktuj się z salonem.`,
    );
  }
}
