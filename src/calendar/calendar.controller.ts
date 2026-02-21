import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Inject,
  Query,
  Put,
  Request,
} from '@nestjs/common';
import { Permissions } from 'src/decorators/permissions.decorator';
import { CreateCalendarDto } from './dto/create-calendar.dto';
import { UpdateCalendarDto } from './dto/update-calendar.dto';
import { AuthenticationGuard } from '@/guard/authentication.guard';
import { AuthorizationGuard } from '@/guard/authorization.guard';
import {
  ApiBearerAuth,
  ApiTags,
} from '@nestjs/swagger';
import {
  CALENDAR_SERVICE,
  CalendarsServiceInterface,
} from '@/calendar/interfaces/calendars-service.interface';
import { Resource } from '@/roles/enums/resource.enum';
import { Action } from '@/roles/enums/action.enum';
import { ResponseDto } from '@/common/dto/response.dto';
import { PaginatedResultDto } from '@/common/dto/paginated-result.dto';
import { PaginationParamsDto } from '@/common/dto/pagination-params.dto';
import { Calendar } from '@/calendar/entities/calendar.entity';
import {
  ApiCreateCalendar,
  ApiDeleteCalendar,
  ApiFindAllCalendars,
  ApiFindCalendarsByOwner,
  ApiFindMyCalendars,
  ApiFindOneCalendar,
  ApiRestoreCalendar,
  ApiSetDefaultCalendar,
  ApiSoftDeleteCalendar,
  ApiUpdateCalendar,
} from '@/calendar/decorators/calendar-swagger.decorator';

@ApiTags('Calendar')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthenticationGuard, AuthorizationGuard)
@Controller('calendar')
export class CalendarController {
  constructor(
    @Inject(CALENDAR_SERVICE)
    private readonly calendarService: CalendarsServiceInterface,
  ) {}

  @ApiCreateCalendar()
  @Permissions([{ resource: Resource.CALENDAR, actions: [Action.CREATE] }])
  @Post()
  async create(
    @Body() createCalendarDto: CreateCalendarDto,
  ): Promise<ResponseDto> {
    return await this.calendarService.create(createCalendarDto);
  }

  @ApiFindAllCalendars()
  @Permissions([{ resource: Resource.CALENDAR, actions: [Action.READ] }])
  @Get()
  async findAll(
    @Query() paginationParams: PaginationParamsDto,
    @Request() req: any,
  ): Promise<PaginatedResultDto<Calendar>> {
    return await this.calendarService.findAll(paginationParams, req.userId);
  }

  @ApiFindMyCalendars()
  @Permissions([{ resource: Resource.CALENDAR, actions: [Action.READ] }])
  @Get('my-calendars')
  async findMyCalendars(
    @Query() paginationParams: PaginationParamsDto,
    @Request() req: any,
  ): Promise<PaginatedResultDto<Calendar>> {
    return await this.calendarService.findByOwner(req.userId, paginationParams);
  }

  @ApiFindCalendarsByOwner()
  @Permissions([{ resource: Resource.CALENDAR, actions: [Action.READ] }])
  @Get('owner/:ownerId')
  async findByOwner(
    @Param('ownerId') ownerId: string,
    @Query() paginationParams: PaginationParamsDto,
  ): Promise<PaginatedResultDto<Calendar>> {
    return await this.calendarService.findByOwner(ownerId, paginationParams);
  }

  @ApiFindOneCalendar()
  @Permissions([{ resource: Resource.CALENDAR, actions: [Action.READ] }])
  @Get(':uuid')
  async findOne(@Param('uuid') uuid: string): Promise<ResponseDto> {
    return await this.calendarService.findOne(uuid);
  }

  @ApiUpdateCalendar()
  @Permissions([{ resource: Resource.CALENDAR, actions: [Action.WRITE] }])
  @Put(':uuid')
  async update(
    @Param('uuid') uuid: string,
    @Body() updateCalendarDto: UpdateCalendarDto,
  ): Promise<ResponseDto> {
    return await this.calendarService.update(uuid, updateCalendarDto);
  }

  @ApiSetDefaultCalendar()
  @Permissions([{ resource: Resource.CALENDAR, actions: [Action.WRITE] }])
  @Put(':uuid/set-default')
  async setDefaultCalendar(
    @Param('uuid') uuid: string,
    @Request() req: any,
  ): Promise<ResponseDto> {
    return await this.calendarService.setDefaultCalendar(uuid, req.userId);
  }

  @ApiSoftDeleteCalendar()
  @Permissions([{ resource: Resource.CALENDAR, actions: [Action.DELETE] }])
  @Delete(':uuid')
  async softDelete(@Param('uuid') uuid: string): Promise<ResponseDto> {
    return await this.calendarService.softDelete(uuid);
  }

  @ApiDeleteCalendar()
  @Permissions([{ resource: Resource.CALENDAR, actions: [Action.ADMIN] }])
  @Delete(':uuid/delete')
  async remove(@Param('uuid') uuid: string): Promise<ResponseDto> {
    return await this.calendarService.remove(uuid);
  }

  @ApiRestoreCalendar()
  @Permissions([{ resource: Resource.CALENDAR, actions: [Action.ADMIN] }])
  @Put(':uuid/restore')
  async restore(@Param('uuid') uuid: string): Promise<ResponseDto> {
    return await this.calendarService.restore(uuid);
  }
}
