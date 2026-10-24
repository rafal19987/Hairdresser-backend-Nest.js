import { ResponseDto } from '@/common/dto/response.dto';
import { AvailableSlotsQueryDto } from '@/booking/dto/available-slots-query.dto';
import { CreateClientBookingDto } from '@/booking/dto/create-client-booking.dto';

export interface BookingServiceInterface {
  findAvailableSlots(query: AvailableSlotsQueryDto): Promise<ResponseDto>;
  findBookableServices(): Promise<ResponseDto>;
  createAppointment(
    dto: CreateClientBookingDto,
    clientId?: string,
  ): Promise<ResponseDto>;
  findBookableEmployees(serviceId: string): Promise<ResponseDto>;
}

export const BOOKING_SERVICE = 'BOOKING_SERVICE';
