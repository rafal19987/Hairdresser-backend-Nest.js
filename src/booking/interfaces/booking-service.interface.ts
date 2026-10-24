import { ResponseDto } from '@/common/dto/response.dto';
import { AvailableSlotsQueryDto } from '@/booking/dto/available-slots-query.dto';

export interface BookingServiceInterface {
  findAvailableSlots(query: AvailableSlotsQueryDto): Promise<ResponseDto>;
}

export const BOOKING_SERVICE = 'BOOKING_SERVICE';
