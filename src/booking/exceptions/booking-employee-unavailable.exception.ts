import { NotFoundException } from '@nestjs/common';

export class BookingEmployeeUnavailableException extends NotFoundException {
  constructor(message?: string) {
    super(
      message ||
        'Wybrany pracownik nie wykonuje tej usługi lub jest niedostępny',
    );
  }
}
