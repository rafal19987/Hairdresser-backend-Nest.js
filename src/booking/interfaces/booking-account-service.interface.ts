import { ResponseDto } from '@/common/dto/response.dto';
import {
  CancelManagedAppointmentDto,
  RescheduleManagedAppointmentDto,
} from '@/booking/dto/manage-booking.dto';
import { UpdateClientProfileDto } from '@/booking/dto/update-client-profile.dto';

export interface BookingAccountServiceInterface {
  getProfile(clientId: string): Promise<ResponseDto>;
  updateProfile(
    clientId: string,
    dto: UpdateClientProfileDto,
  ): Promise<ResponseDto>;
  findAppointments(clientId: string): Promise<ResponseDto>;
  cancelAppointment(
    clientId: string,
    uuid: string,
    dto: CancelManagedAppointmentDto,
  ): Promise<ResponseDto>;
  rescheduleAppointment(
    clientId: string,
    uuid: string,
    dto: RescheduleManagedAppointmentDto,
  ): Promise<ResponseDto>;
  findRescheduleSlots(
    clientId: string,
    uuid: string,
    date: string,
  ): Promise<ResponseDto>;
}

export const BOOKING_ACCOUNT_SERVICE = 'BOOKING_ACCOUNT_SERVICE';
