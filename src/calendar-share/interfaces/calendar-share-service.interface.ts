import { ResponseDto } from '@/common/dto/response.dto';
import { CreateCalendarShareDto } from '../dto/create-calendar-share.dto';
import { UpdateCalendarShareDto } from '../dto/update-calendar-share.dto';
import { PaginationParamsDto } from '@/common/dto/pagination-params.dto';
import { PaginatedResultDto } from '@/common/dto/paginated-result.dto';
import { CalendarShare } from '../entities/calendar-share.entity';

export interface CalendarShareServiceInterface {
  create(createCalendarShareDto: CreateCalendarShareDto): Promise<ResponseDto>;

  findAll(
    paginationParams: PaginationParamsDto,
    userId?: string,
  ): Promise<PaginatedResultDto<CalendarShare>>;

  findOne(uuid: string): Promise<ResponseDto>;

  findByCalendar(
    calendarId: string,
    paginationParams: PaginationParamsDto,
  ): Promise<PaginatedResultDto<CalendarShare>>;

  findBySharedUser(
    userId: string,
    paginationParams: PaginationParamsDto,
  ): Promise<PaginatedResultDto<CalendarShare>>;

  update(
    uuid: string,
    updateCalendarShareDto: UpdateCalendarShareDto,
  ): Promise<ResponseDto>;

  remove(uuid: string): Promise<ResponseDto>;

  revokeAccess(uuid: string): Promise<ResponseDto>;

  checkUserAccess(
    calendarId: string,
    userId: string,
  ): Promise<CalendarShare | null>;

  updatePermission(uuid: string, permission: string): Promise<ResponseDto>;
}

export const CALENDAR_SHARE_SERVICE = 'CALENDAR_SHARE_SERVICE';
