import { ResponseDto } from '@/common/dto/response.dto';
import { PaginationParamsDto } from '@/common/dto/pagination-params.dto';
import { PaginatedResultDto } from '@/common/dto/paginated-result.dto';
import { Calendar } from '@/calendar/entities/calendar.entity';
import { CreateCalendarDto } from '@/calendar/dto/create-calendar.dto';
import { UpdateCalendarDto } from '@/calendar/dto/update-calendar.dto';

export interface CalendarsServiceInterface {
  create(createCalendarDto: CreateCalendarDto): Promise<ResponseDto>;

  findAll(
    paginationParams: PaginationParamsDto,
    userId?: string,
  ): Promise<PaginatedResultDto<Calendar>>;

  findOne(uuid: string): Promise<ResponseDto>;

  findByOwner(
    ownerId: string,
    paginationParams: PaginationParamsDto,
  ): Promise<PaginatedResultDto<Calendar>>;

  update(
    uuid: string,
    updateCalendarDto: UpdateCalendarDto,
  ): Promise<ResponseDto>;

  softDelete(uuid: string): Promise<ResponseDto>;

  remove(uuid: string): Promise<ResponseDto>;

  restore(uuid: string): Promise<ResponseDto>;

  setDefaultCalendar(uuid: string, ownerId: string): Promise<ResponseDto>;
}

export const CALENDAR_SERVICE = 'CALENDAR_SERVICE';
