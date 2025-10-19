import { Controller, Post, Body, UseGuards, Inject } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
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

@UseGuards(AuthenticationGuard, AuthorizationGuard)
@ApiTags('Appointments')
@ApiBearerAuth('JWT-auth')
@Controller('appointments')
export class AppointmentsController {
  constructor(
    @Inject(APPOINTMENTS_SERVICE)
    private readonly appointmentsService: AppointmentsServiceInterface,
  ) {}

  @Permissions([{ resource: Resource.CALENDAR, actions: [Action.CREATE] }])
  @Post()
  @ApiOperation({
    summary: 'Utwórz nowe spotkanie',
    description: 'Tworzy nowe spotkanie w określonym kalendarzu',
  })
  @ApiBody({
    type: CreateAppointmentDto,
    description: 'Dane spotkania do utworzenia',
  })
  @ApiResponse({
    status: 201,
    description: 'Spotkanie zostało utworzone',
  })
  @ApiResponse({
    status: 400,
    description: 'Nieprawidłowe dane wejściowe',
  })
  async create(
    @Body() createAppointmentDto: CreateAppointmentDto,
  ): Promise<ResponseDto> {
    return await this.appointmentsService.create(createAppointmentDto);
  }
}
