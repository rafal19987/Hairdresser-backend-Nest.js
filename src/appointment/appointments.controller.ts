import { Controller, Post, Body, UseGuards, Inject } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { ResponseDto } from '@/common/dto/response.dto';
import { AuthenticationGuard } from '@/guards/authentication.guard';
import { AuthorizationGuard } from '@/guards/authorization.guard';
import { Permissions } from '@/decorators/permissions.decorator';
import { Action } from '@/roles/enums/action.enum';
import { Resource } from '@/roles/enums/resource.enum';
import {
  APPOINTMENTS_SERVICE,
  AppointmentsServiceInterface,
} from '@/appointment/interfaces/appointments-service.interface';
import { ApiCreateAppointment } from '@/appointment/decorators/appointments-swagger.decorator';

@ApiTags('Appointments')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthenticationGuard, AuthorizationGuard)
@Controller('appointments')
export class AppointmentsController {
  constructor(
    @Inject(APPOINTMENTS_SERVICE)
    private readonly appointmentsService: AppointmentsServiceInterface,
  ) {}

  @ApiCreateAppointment()
  @Permissions([{ resource: Resource.CALENDAR, actions: [Action.CREATE] }])
  @Post()
  async create(
    @Body() createAppointmentDto: CreateAppointmentDto,
  ): Promise<ResponseDto> {
    return await this.appointmentsService.create(createAppointmentDto);
  }
}
