import { ResponseDto } from '@/common/dto/response.dto';
import {
  CancelManagedAppointmentDto,
  RescheduleManagedAppointmentDto,
} from '@/booking/dto/manage-booking.dto';

export interface BookingManageServiceInterface {
  findAppointments(email: string): Promise<ResponseDto>;
  cancelAppointment(
    email: string,
    uuid: string,
    dto: CancelManagedAppointmentDto,
  ): Promise<ResponseDto>;
  rescheduleAppointment(
    email: string,
    uuid: string,
    dto: RescheduleManagedAppointmentDto,
  ): Promise<ResponseDto>;
  sendManageLink(email: string): Promise<ResponseDto>;
}

export const BOOKING_MANAGE_SERVICE = 'BOOKING_MANAGE_SERVICE';
