import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  Query,
  UseGuards,
  Inject,
  Request,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CreateCalendarShareDto } from './dto/create-calendar-share.dto';
import { UpdateCalendarShareDto } from './dto/update-calendar-share.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import {
  CALENDAR_SHARE_SERVICE,
  CalendarShareServiceInterface,
} from '@/calendar-share/interfaces/calendar-share-service.interface';
import { AuthenticationGuard } from '@/guards/authentication.guard';
import { AuthorizationGuard } from '@/guards/authorization.guard';
import { Permissions } from '@/decorators/permissions.decorator';
import { Resource } from '@/roles/enums/resource.enum';
import { Action } from '@/roles/enums/action.enum';
import { PaginationParamsDto } from '@/common/dto/pagination-params.dto';
import { PaginatedResultDto } from '@/common/dto/paginated-result.dto';
import { CalendarShare } from './entities/calendar-share.entity';
import { ResponseDto } from '@/common/dto/response.dto';
import { ResponseHelper } from '@/common/helpers/response.helper';
import { CalendarSharePermissionException } from '@/calendar-share/exceptions/calendar-share-permission.exception';
import {
  ApiCheckCalendarAccess,
  ApiCreateCalendarShare,
  ApiDeleteCalendarShare,
  ApiFindAllCalendarShares,
  ApiFindMySharedCalendars,
  ApiFindOneCalendarShare,
  ApiFindSharesByCalendar,
  ApiRevokeCalendarAccess,
  ApiUpdateCalendarShare,
  ApiUpdateCalendarSharePermission,
} from '@/calendar-share/decorators/calendar-share-swagger.decorator';

@ApiTags('Calendar Share')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthenticationGuard, AuthorizationGuard)
@Controller('calendar-share')
export class CalendarShareController {
  constructor(
    @Inject(CALENDAR_SHARE_SERVICE)
    private readonly calendarShareService: CalendarShareServiceInterface,
  ) {}

  @ApiCreateCalendarShare()
  @Permissions([{ resource: Resource.CALENDAR, actions: [Action.WRITE] }])
  @Post()
  async create(
    @Body() createCalendarShareDto: CreateCalendarShareDto,
  ): Promise<ResponseDto> {
    return await this.calendarShareService.create(createCalendarShareDto);
  }

  @ApiFindAllCalendarShares()
  @Permissions([{ resource: Resource.CALENDAR, actions: [Action.READ] }])
  @Get()
  async findAll(
    @Query() paginationParams: PaginationParamsDto,
    @Request() req: any,
  ): Promise<PaginatedResultDto<CalendarShare>> {
    return await this.calendarShareService.findAll(
      paginationParams,
      req.userId,
    );
  }

  @ApiFindMySharedCalendars()
  @Permissions([{ resource: Resource.CALENDAR, actions: [Action.READ] }])
  @Get('my-shared-calendars')
  async findMySharedCalendars(
    @Query() paginationParams: PaginationParamsDto,
    @Request() req: any,
  ): Promise<PaginatedResultDto<CalendarShare>> {
    return await this.calendarShareService.findBySharedUser(
      req.userId,
      paginationParams,
    );
  }

  @ApiFindSharesByCalendar()
  @Permissions([{ resource: Resource.CALENDAR, actions: [Action.READ] }])
  @Get('calendar/:calendarId')
  async findByCalendar(
    @Param('calendarId') calendarId: string,
    @Query() paginationParams: PaginationParamsDto,
  ): Promise<PaginatedResultDto<CalendarShare>> {
    return await this.calendarShareService.findByCalendar(
      calendarId,
      paginationParams,
    );
  }

  @ApiCheckCalendarAccess()
  @Permissions([{ resource: Resource.CALENDAR, actions: [Action.READ] }])
  @Get('check-access/:calendarId')
  async checkAccess(
    @Param('calendarId') calendarId: string,
    @Request() req: any,
  ): Promise<ResponseDto> {
    const access = await this.calendarShareService.checkUserAccess(
      calendarId,
      req.userId,
    );

    if (!access) {
      throw new CalendarSharePermissionException(
        'Brak dostępu do tego kalendarza',
      );
    }

    return ResponseHelper.success(
      'Dostęp do kalendarza potwierdzony',
      HttpStatus.OK,
      {
        calendarId,
        permission: access.permission,
        canRead: access.canRead(),
        canCreate: access.canCreate(),
        canWrite: access.canWrite(),
        canDelete: access.canDelete(),
      },
    );
  }

  @ApiFindOneCalendarShare()
  @Permissions([{ resource: Resource.CALENDAR, actions: [Action.READ] }])
  @Get(':uuid')
  async findOne(@Param('uuid') uuid: string): Promise<ResponseDto> {
    return await this.calendarShareService.findOne(uuid);
  }

  @ApiUpdateCalendarShare()
  @Permissions([{ resource: Resource.CALENDAR, actions: [Action.WRITE] }])
  @Put(':uuid')
  async update(
    @Param('uuid') uuid: string,
    @Body() updateCalendarShareDto: UpdateCalendarShareDto,
  ): Promise<ResponseDto> {
    return await this.calendarShareService.update(uuid, updateCalendarShareDto);
  }

  @ApiDeleteCalendarShare()
  @Permissions([{ resource: Resource.CALENDAR, actions: [Action.DELETE] }])
  @Delete(':uuid')
  async remove(@Param('uuid') uuid: string): Promise<ResponseDto> {
    return await this.calendarShareService.remove(uuid);
  }

  @ApiRevokeCalendarAccess()
  @Permissions([{ resource: Resource.CALENDAR, actions: [Action.WRITE] }])
  @Put(':uuid/revoke')
  async revokeAccess(@Param('uuid') uuid: string): Promise<ResponseDto> {
    return await this.calendarShareService.revokeAccess(uuid);
  }

  @ApiUpdateCalendarSharePermission()
  @Permissions([{ resource: Resource.CALENDAR, actions: [Action.WRITE] }])
  @Put(':uuid/permission')
  async updatePermission(
    @Param('uuid') uuid: string,
    @Body() updatePermissionDto: UpdatePermissionDto,
  ): Promise<ResponseDto> {
    return await this.calendarShareService.updatePermission(
      uuid,
      updatePermissionDto.permission,
    );
  }
}
