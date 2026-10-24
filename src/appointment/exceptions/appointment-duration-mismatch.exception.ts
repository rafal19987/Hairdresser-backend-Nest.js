import { BadRequestException } from '@nestjs/common';

export class AppointmentDurationMismatchException extends BadRequestException {
  constructor(message?: string) {
    super(
      message || 'Czas trwania nie zgadza się z datą rozpoczęcia i zakończenia',
    );
  }
}
