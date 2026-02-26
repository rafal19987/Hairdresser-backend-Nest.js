import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import {
  APPOINTMENTS_SERVICE,
  AppointmentsServiceInterface,
} from '@/appointment/interfaces/appointments-service.interface';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { CreateInternalAppointmentDto } from './dto/create-internal-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { CancelAppointmentDto } from './dto/cancel-appointment.dto';
import { RescheduleAppointmentDto } from './dto/reschedule-appointment.dto';
import { ResponseDto } from '@/common/dto/response.dto';
import { PaginationParamsDto } from '@/common/dto/pagination-params.dto';
import { AuthenticationGuard } from '@/guards/authentication.guard';
import { AuthorizationGuard } from '@/guards/authorization.guard';
import { Permissions } from '@/decorators/permissions.decorator';
import { Action } from '@/roles/enums/action.enum';
import { Resource } from '@/roles/enums/resource.enum';
import {
  ApiFindAllAppointments,
  ApiFindAppointmentsByCalendar,
  ApiFindOneAppointment,
  ApiCreateAppointment,
  ApiCreateInternalAppointment,
  ApiUpdateAppointment,
  ApiCancelAppointment,
  ApiRescheduleAppointment,
  ApiDeleteAppointment,
} from '@/appointment/decorators/appointments-swagger.decorator';

@ApiTags('Appointments')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthenticationGuard, AuthorizationGuard)
@Controller('appointments')
export class AppointmentsController {
  constructor(
    @Inject(APPOINTMENTS_SERVICE)
    private readonly appointmentsService: AppointmentsServiceInterface,
  ) {}

  @ApiFindAllAppointments()
  @Permissions([{ resource: Resource.CALENDAR, actions: [Action.READ] }])
  @Get()
  async findAll(@Query() paginationParams: PaginationParamsDto) {
    return await this.appointmentsService.findAll(paginationParams);
  }

  @ApiFindAppointmentsByCalendar()
  @Permissions([{ resource: Resource.CALENDAR, actions: [Action.READ] }])
  @Get('calendar/:uuid')
  async findByCalendar(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Query() paginationParams: PaginationParamsDto,
  ) {
    return await this.appointmentsService.findByCalendar(
      uuid,
      paginationParams,
    );
  }

  @ApiFindOneAppointment()
  @Permissions([{ resource: Resource.CALENDAR, actions: [Action.READ] }])
  @Get(':uuid')
  async find(@Param('uuid', ParseUUIDPipe) uuid: string): Promise<ResponseDto> {
    return await this.appointmentsService.find(uuid);
  }

  @ApiCreateAppointment()
  @Permissions([{ resource: Resource.CALENDAR, actions: [Action.CREATE] }])
  @Post()
  async create(
    @Body() createAppointmentDto: CreateAppointmentDto,
  ): Promise<ResponseDto> {
    return await this.appointmentsService.create(createAppointmentDto);
  }

  @ApiCreateInternalAppointment()
  @Permissions([{ resource: Resource.CALENDAR, actions: [Action.CREATE] }])
  @Post('internal')
  async createInternal(
    @Body() createInternalAppointmentDto: CreateInternalAppointmentDto,
  ): Promise<ResponseDto> {
    return await this.appointmentsService.createInternal(
      createInternalAppointmentDto,
    );
  }

  @ApiUpdateAppointment()
  @Permissions([{ resource: Resource.CALENDAR, actions: [Action.WRITE] }])
  @Put(':uuid')
  async update(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Body() updateAppointmentDto: UpdateAppointmentDto,
  ): Promise<ResponseDto> {
    return await this.appointmentsService.update(uuid, updateAppointmentDto);
  }

  @ApiCancelAppointment()
  @Permissions([{ resource: Resource.CALENDAR, actions: [Action.WRITE] }])
  @Patch(':uuid/cancel')
  async cancel(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Body() cancelAppointmentDto: CancelAppointmentDto,
  ): Promise<ResponseDto> {
    return await this.appointmentsService.cancel(uuid, cancelAppointmentDto);
  }

  @ApiRescheduleAppointment()
  @Permissions([{ resource: Resource.CALENDAR, actions: [Action.WRITE] }])
  @Patch(':uuid/reschedule')
  async reschedule(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Body() rescheduleAppointmentDto: RescheduleAppointmentDto,
  ): Promise<ResponseDto> {
    return await this.appointmentsService.reschedule(
      uuid,
      rescheduleAppointmentDto,
    );
  }

  @ApiDeleteAppointment()
  @Permissions([{ resource: Resource.CALENDAR, actions: [Action.ADMIN] }])
  @Delete(':uuid')
  async remove(
    @Param('uuid', ParseUUIDPipe) uuid: string,
  ): Promise<ResponseDto> {
    return await this.appointmentsService.remove(uuid);
  }
}
