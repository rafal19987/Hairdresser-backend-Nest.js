import { ResponseDto } from '@/common/dto/response.dto';
import { CreateAppointmentDto } from '../dto/create-appointment.dto';

export interface AppointmentsServiceInterface {
  create(createAppointmentDto: CreateAppointmentDto): Promise<ResponseDto>;
}

export const APPOINTMENTS_SERVICE = 'APPOINTMENTS_SERVICE';
