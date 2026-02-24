import { Appointment } from '../entities/appointment.entity';
import { CreateAppointmentDto } from '../dto/create-appointment.dto';
import { CreateInternalAppointmentDto } from '../dto/create-internal-appointment.dto';
import { UpdateAppointmentDto } from '../dto/update-appointment.dto';
import { CancelAppointmentDto } from '../dto/cancel-appointment.dto';
import { RescheduleAppointmentDto } from '../dto/reschedule-appointment.dto';
import { PaginationParamsDto } from '@/common/dto/pagination-params.dto';
import { PaginatedResultDto } from '@/common/dto/paginated-result.dto';
import { ResponseDto } from '@/common/dto/response.dto';

export interface AppointmentsServiceInterface {
  findAll(
    paginationParams: PaginationParamsDto,
  ): Promise<PaginatedResultDto<Appointment>>;
  findByCalendar(
    calendarUuid: string,
    paginationParams: PaginationParamsDto,
  ): Promise<PaginatedResultDto<Appointment>>;
  find(uuid: string): Promise<ResponseDto>;
  create(
    createAppointmentDto: CreateAppointmentDto,
    clientUuid?: string,
  ): Promise<ResponseDto>;
  createInternal(
    createInternalAppointmentDto: CreateInternalAppointmentDto,
  ): Promise<ResponseDto>;
  update(
    uuid: string,
    updateAppointmentDto: UpdateAppointmentDto,
  ): Promise<ResponseDto>;
  cancel(
    uuid: string,
    cancelAppointmentDto: CancelAppointmentDto,
  ): Promise<ResponseDto>;
  reschedule(
    uuid: string,
    rescheduleAppointmentDto: RescheduleAppointmentDto,
  ): Promise<ResponseDto>;
  remove(uuid: string): Promise<ResponseDto>;
}

export const APPOINTMENTS_SERVICE = 'APPOINTMENTS_SERVICE';
