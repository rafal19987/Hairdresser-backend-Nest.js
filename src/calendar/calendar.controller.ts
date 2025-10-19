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
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
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

@UseGuards(AuthenticationGuard, AuthorizationGuard)
@ApiTags('Calendar')
@ApiBearerAuth('JWT-auth')
@Controller('calendar')
export class CalendarController {
  constructor(
    @Inject(CALENDAR_SERVICE)
    private readonly calendarService: CalendarsServiceInterface,
  ) {}

  @Permissions([{ resource: Resource.CALENDAR, actions: [Action.CREATE] }])
  @Post()
  @ApiOperation({
    summary: 'Utwórz nowy kalendarz',
    description: 'Tworzy nowy kalendarz dla użytkownika',
  })
  @ApiBody({ type: CreateCalendarDto, description: 'Dane kalendarza' })
  @ApiResponse({
    status: 201,
    description: 'Kalendarz został utworzony pomyślnie',
  })
  @ApiResponse({ status: 400, description: 'Nieprawidłowe dane' })
  @ApiResponse({
    status: 409,
    description: 'Kalendarz o tej nazwie już istnieje dla tego użytkownika',
  })
  async create(
    @Body() createCalendarDto: CreateCalendarDto,
  ): Promise<ResponseDto> {
    return await this.calendarService.create(createCalendarDto);
  }

  @Permissions([{ resource: Resource.CALENDAR, actions: [Action.READ] }])
  @Get()
  @ApiOperation({
    summary: 'Pobierz wszystkie kalendarze',
    description: 'Zwraca paginowaną listę wszystkich aktywnych kalendarzy',
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
    description: 'Lista kalendarzy została pobrana pomyślnie',
    type: PaginatedResultDto,
  })
  async findAll(
    @Query() paginationParams: PaginationParamsDto,
    @Request() req: any,
  ): Promise<PaginatedResultDto<Calendar>> {
    return await this.calendarService.findAll(paginationParams, req.userId);
  }

  @Permissions([{ resource: Resource.CALENDAR, actions: [Action.READ] }])
  @Get('my-calendars')
  @ApiOperation({
    summary: 'Pobierz kalendarze zalogowanego użytkownika',
    description:
      'Zwraca paginowaną listę kalendarzy należących do zalogowanego użytkownika',
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
    description: 'Lista kalendarzy użytkownika została pobrana pomyślnie',
    type: PaginatedResultDto,
  })
  async findMyCalendars(
    @Query() paginationParams: PaginationParamsDto,
    @Request() req: any,
  ): Promise<PaginatedResultDto<Calendar>> {
    return await this.calendarService.findByOwner(req.userId, paginationParams);
  }

  @Permissions([{ resource: Resource.CALENDAR, actions: [Action.READ] }])
  @Get('owner/:ownerId')
  @ApiOperation({
    summary: 'Pobierz kalendarze według właściciela',
    description:
      'Zwraca paginowaną listę kalendarzy należących do określonego użytkownika',
  })
  @ApiParam({
    name: 'ownerId',
    description: 'UUID właściciela',
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
    description: 'Lista kalendarzy użytkownika została pobrana pomyślnie',
    type: PaginatedResultDto,
  })
  async findByOwner(
    @Param('ownerId') ownerId: string,
    @Query() paginationParams: PaginationParamsDto,
  ): Promise<PaginatedResultDto<Calendar>> {
    return await this.calendarService.findByOwner(ownerId, paginationParams);
  }

  @Permissions([{ resource: Resource.CALENDAR, actions: [Action.READ] }])
  @Get(':uuid')
  @ApiOperation({
    summary: 'Pobierz kalendarz po UUID',
    description: 'Zwraca szczegóły konkretnego kalendarza',
  })
  @ApiParam({
    name: 'uuid',
    description: 'UUID kalendarza',
    type: String,
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Kalendarz znaleziony pomyślnie',
  })
  @ApiResponse({ status: 404, description: 'Kalendarz nie został znaleziony' })
  async findOne(@Param('uuid') uuid: string): Promise<ResponseDto> {
    return await this.calendarService.findOne(uuid);
  }

  @Permissions([{ resource: Resource.CALENDAR, actions: [Action.WRITE] }])
  @Put(':uuid')
  @ApiOperation({
    summary: 'Zaktualizuj kalendarz',
    description: 'Aktualizuje istniejący kalendarz',
  })
  @ApiParam({
    name: 'uuid',
    description: 'UUID kalendarza',
    type: String,
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiBody({
    type: UpdateCalendarDto,
    description: 'Zaktualizowane dane kalendarza',
  })
  @ApiResponse({
    status: 200,
    description: 'Kalendarz został zaktualizowany pomyślnie',
  })
  @ApiResponse({ status: 400, description: 'Nieprawidłowe dane' })
  @ApiResponse({ status: 404, description: 'Kalendarz nie został znaleziony' })
  async update(
    @Param('uuid') uuid: string,
    @Body() updateCalendarDto: UpdateCalendarDto,
  ): Promise<ResponseDto> {
    return await this.calendarService.update(uuid, updateCalendarDto);
  }

  @Permissions([{ resource: Resource.CALENDAR, actions: [Action.WRITE] }])
  @Put(':uuid/set-default')
  @ApiOperation({
    summary: 'Ustaw kalendarz jako domyślny',
    description: 'Ustawia wybrany kalendarz jako domyślny dla użytkownika',
  })
  @ApiParam({
    name: 'uuid',
    description: 'UUID kalendarza',
    type: String,
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Kalendarz został ustawiony jako domyślny',
  })
  @ApiResponse({ status: 404, description: 'Kalendarz nie został znaleziony' })
  async setDefaultCalendar(
    @Param('uuid') uuid: string,
    @Request() req: any,
  ): Promise<ResponseDto> {
    return await this.calendarService.setDefaultCalendar(uuid, req.userId);
  }

  @Permissions([{ resource: Resource.CALENDAR, actions: [Action.DELETE] }])
  @Delete(':uuid')
  @ApiOperation({
    summary: 'Usuń kalendarz (soft delete)',
    description: 'Oznacza kalendarz jako usunięty bez usuwania z bazy danych',
  })
  @ApiParam({
    name: 'uuid',
    description: 'UUID kalendarza',
    type: String,
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 202,
    description: 'Kalendarz został usunięty pomyślnie',
  })
  @ApiResponse({ status: 404, description: 'Kalendarz nie został znaleziony' })
  async softDelete(@Param('uuid') uuid: string): Promise<ResponseDto> {
    return await this.calendarService.softDelete(uuid);
  }

  @Permissions([{ resource: Resource.CALENDAR, actions: [Action.ADMIN] }])
  @Delete(':uuid/delete')
  @ApiOperation({
    summary: 'Usuń kalendarz trwale',
    description: 'Trwale usuwa kalendarz z bazy danych',
  })
  @ApiParam({
    name: 'uuid',
    description: 'UUID kalendarza',
    type: String,
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Kalendarz został trwale usunięty',
  })
  @ApiResponse({ status: 404, description: 'Kalendarz nie został znaleziony' })
  async remove(@Param('uuid') uuid: string): Promise<ResponseDto> {
    return await this.calendarService.remove(uuid);
  }

  @Permissions([{ resource: Resource.CALENDAR, actions: [Action.ADMIN] }])
  @Put(':uuid/restore')
  @ApiOperation({
    summary: 'Przywróć usunięty kalendarz',
    description: 'Przywraca wcześniej usunięty kalendarz',
  })
  @ApiParam({
    name: 'uuid',
    description: 'UUID kalendarza',
    type: String,
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Kalendarz został przywrócony pomyślnie',
  })
  @ApiResponse({ status: 404, description: 'Kalendarz nie został znaleziony' })
  @ApiResponse({ status: 400, description: 'Kalendarz nie jest usunięty' })
  async restore(@Param('uuid') uuid: string): Promise<ResponseDto> {
    return await this.calendarService.restore(uuid);
  }
}
