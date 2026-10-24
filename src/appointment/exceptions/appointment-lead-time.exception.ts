import { BadRequestException } from '@nestjs/common';

export class AppointmentLeadTimeException extends BadRequestException {
  constructor(minLeadTimeMinutes: number) {
    super(
      `Wizytę można zarezerwować najpóźniej ${minLeadTimeMinutes} minut przed jej rozpoczęciem`,
    );
  }
}
