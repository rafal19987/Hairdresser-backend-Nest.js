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
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiQuery,
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

@UseGuards(AuthenticationGuard, AuthorizationGuard)
@ApiTags('Calendar Share')
@ApiBearerAuth('JWT-auth')
@Controller('calendar-share')
export class CalendarShareController {
  constructor(
    @Inject(CALENDAR_SHARE_SERVICE)
    private readonly calendarShareService: CalendarShareServiceInterface,
  ) {}

  @Permissions([{ resource: Resource.CALENDAR, actions: [Action.WRITE] }])
  @Post()
  @ApiOperation({
    summary: 'Udostępnij kalendarz',
    description:
      'Udostępnia kalendarz innemu użytkownikowi z określonymi uprawnieniami',
  })
  @ApiBody({ type: CreateCalendarShareDto, description: 'Dane udostępnienia' })
  @ApiResponse({
    status: 201,
    description: 'Kalendarz został udostępniony pomyślnie',
  })
  @ApiResponse({ status: 400, description: 'Nieprawidłowe dane' })
  @ApiResponse({
    status: 409,
    description: 'Kalendarz jest już udostępniony temu użytkownikowi',
  })
  async create(
    @Body() createCalendarShareDto: CreateCalendarShareDto,
  ): Promise<ResponseDto> {
    return await this.calendarShareService.create(createCalendarShareDto);
  }

  @Permissions([{ resource: Resource.CALENDAR, actions: [Action.READ] }])
  @Get()
  @ApiOperation({
    summary: 'Pobierz wszystkie udostępnienia',
    description: 'Zwraca paginowaną listę wszystkich udostępnień kalendarzy',
  })
  @ApiQuery({
    name: 'page',
    description: 'Numer strony',
    required: false,
    type: Number,
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    description: 'Liczba elementów na stronę',
    required: false,
    type: Number,
    example: 10,
  })
  @ApiQuery({
    name: 'query',
    description: 'Fraza do wyszukiwania',
    required: false,
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Lista udostępnień została pobrana pomyślnie',
    type: PaginatedResultDto,
  })
  async findAll(
    @Query() paginationParams: PaginationParamsDto,
    @Request() req: any,
  ): Promise<PaginatedResultDto<CalendarShare>> {
    return await this.calendarShareService.findAll(
      paginationParams,
      req.userId,
    );
  }

  @Permissions([{ resource: Resource.CALENDAR, actions: [Action.READ] }])
  @Get('my-shared-calendars')
  @ApiOperation({
    summary: 'Pobierz kalendarze udostępnione zalogowanemu użytkownikowi',
    description:
      'Zwraca listę kalendarzy, które zostały udostępnione zalogowanemu użytkownikowi',
  })
  @ApiQuery({
    name: 'page',
    description: 'Numer strony',
    required: false,
    type: Number,
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    description: 'Liczba elementów na stronę',
    required: false,
    type: Number,
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: 'Lista udostępnionych kalendarzy została pobrana pomyślnie',
    type: PaginatedResultDto,
  })
  async findMySharedCalendars(
    @Query() paginationParams: PaginationParamsDto,
    @Request() req: any,
  ): Promise<PaginatedResultDto<CalendarShare>> {
    return await this.calendarShareService.findBySharedUser(
      req.userId,
      paginationParams,
    );
  }

  @Permissions([{ resource: Resource.CALENDAR, actions: [Action.READ] }])
  @Get('calendar/:calendarId')
  @ApiOperation({
    summary: 'Pobierz udostępnienia dla kalendarza',
    description:
      'Zwraca listę użytkowników, którym udostępniono określony kalendarz',
  })
  @ApiParam({
    name: 'calendarId',
    description: 'UUID kalendarza',
    type: String,
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiQuery({
    name: 'page',
    description: 'Numer strony',
    required: false,
    type: Number,
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    description: 'Liczba elementów na stronę',
    required: false,
    type: Number,
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: 'Lista udostępnień kalendarza została pobrana pomyślnie',
    type: PaginatedResultDto,
  })
  async findByCalendar(
    @Param('calendarId') calendarId: string,
    @Query() paginationParams: PaginationParamsDto,
  ): Promise<PaginatedResultDto<CalendarShare>> {
    return await this.calendarShareService.findByCalendar(
      calendarId,
      paginationParams,
    );
  }

  @Permissions([{ resource: Resource.CALENDAR, actions: [Action.READ] }])
  @Get('check-access/:calendarId')
  @ApiOperation({
    summary: 'Sprawdź dostęp do kalendarza',
    description:
      'Sprawdza czy zalogowany użytkownik ma dostęp do określonego kalendarza',
  })
  @ApiParam({
    name: 'calendarId',
    description: 'UUID kalendarza',
    type: String,
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Informacja o dostępie',
  })
  @ApiResponse({
    status: 404,
    description: 'Brak dostępu do kalendarza',
  })
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

  @Permissions([{ resource: Resource.CALENDAR, actions: [Action.READ] }])
  @Get(':uuid')
  @ApiOperation({
    summary: 'Pobierz udostępnienie po UUID',
    description: 'Zwraca szczegóły konkretnego udostępnienia',
  })
  @ApiParam({
    name: 'uuid',
    description: 'UUID udostępnienia',
    type: String,
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Udostępnienie znalezione pomyślnie',
  })
  @ApiResponse({
    status: 404,
    description: 'Udostępnienie nie zostało znalezione',
  })
  async findOne(@Param('uuid') uuid: string): Promise<ResponseDto> {
    return await this.calendarShareService.findOne(uuid);
  }

  @Permissions([{ resource: Resource.CALENDAR, actions: [Action.WRITE] }])
  @Put(':uuid')
  @ApiOperation({
    summary: 'Zaktualizuj udostępnienie',
    description: 'Aktualizuje istniejące udostępnienie kalendarza',
  })
  @ApiParam({
    name: 'uuid',
    description: 'UUID udostępnienia',
    type: String,
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiBody({
    type: UpdateCalendarShareDto,
    description: 'Zaktualizowane dane udostępnienia',
  })
  @ApiResponse({
    status: 200,
    description: 'Udostępnienie zostało zaktualizowane pomyślnie',
  })
  @ApiResponse({ status: 400, description: 'Nieprawidłowe dane' })
  @ApiResponse({
    status: 404,
    description: 'Udostępnienie nie zostało znalezione',
  })
  async update(
    @Param('uuid') uuid: string,
    @Body() updateCalendarShareDto: UpdateCalendarShareDto,
  ): Promise<ResponseDto> {
    return await this.calendarShareService.update(uuid, updateCalendarShareDto);
  }

  @Permissions([{ resource: Resource.CALENDAR, actions: [Action.DELETE] }])
  @Delete(':uuid')
  @ApiOperation({
    summary: 'Usuń udostępnienie',
    description: 'Usuwa konkretne udostępnienie kalendarza',
  })
  @ApiParam({
    name: 'uuid',
    description: 'UUID udostępnienia',
    type: String,
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Udostępnienie zostało usunięte',
  })
  @ApiResponse({
    status: 404,
    description: 'Udostępnienie nie zostało znalezione',
  })
  async remove(@Param('uuid') uuid: string): Promise<ResponseDto> {
    return await this.calendarShareService.remove(uuid);
  }

  @Permissions([{ resource: Resource.CALENDAR, actions: [Action.WRITE] }])
  @Put(':uuid/revoke')
  @ApiOperation({
    summary: 'Cofnij dostęp do kalendarza',
    description: 'Dezaktywuje udostępnienie bez jego usuwania',
  })
  @ApiParam({
    name: 'uuid',
    description: 'UUID udostępnienia',
    type: String,
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Dostęp został cofnięty pomyślnie',
  })
  @ApiResponse({
    status: 404,
    description: 'Udostępnienie nie zostało znalezione',
  })
  async revokeAccess(@Param('uuid') uuid: string): Promise<ResponseDto> {
    return await this.calendarShareService.revokeAccess(uuid);
  }

  @Permissions([{ resource: Resource.CALENDAR, actions: [Action.WRITE] }])
  @Put(':uuid/permission')
  @ApiOperation({
    summary: 'Zmień poziom uprawnień',
    description: 'Aktualizuje poziom dostępu do kalendarza w udostępnieniu',
  })
  @ApiParam({
    name: 'uuid',
    description: 'UUID udostępnienia',
    type: String,
  })
  @ApiBody({
    type: UpdatePermissionDto,
    description: 'Nowy poziom uprawnień (read, create, write, full)',
  })
  @ApiResponse({
    status: 200,
    description: 'Uprawnienia zostały zaktualizowane',
  })
  @ApiResponse({
    status: 400,
    description: 'Nieprawidłowy poziom uprawnień',
  })
  @ApiResponse({
    status: 404,
    description: 'Udostępnienie nie zostało znalezione',
  })
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
