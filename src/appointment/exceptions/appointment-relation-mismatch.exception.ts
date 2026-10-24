import { BadRequestException } from '@nestjs/common';

export class AppointmentRelationMismatchException extends BadRequestException {
  constructor(message?: string) {
    super(message || 'Powiązane dane nie należą do wskazanego pracownika');
  }
}
