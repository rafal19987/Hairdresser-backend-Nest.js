import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  ParseUUIDPipe,
  Patch,
  Put,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { ResponseDto } from '@/common/dto/response.dto';
import { ClientAuthenticationGuard } from '@/auth-client/guards/optional-client-authentication.guard';
import {
  BOOKING_ACCOUNT_SERVICE,
  BookingAccountServiceInterface,
} from '@/booking/interfaces/booking-account-service.interface';
import {
  CancelManagedAppointmentDto,
  RescheduleManagedAppointmentDto,
} from '@/booking/dto/manage-booking.dto';
import { UpdateClientProfileDto } from '@/booking/dto/update-client-profile.dto';
import {
  ApiCancelAccountAppointment,
  ApiFindAccountAppointments,
  ApiGetClientProfile,
  ApiRescheduleAccountAppointment,
  ApiUpdateClientProfile,
} from '@/booking/decorators/booking-account-swagger.decorator';

@ApiTags('Booking')
@ApiBearerAuth('JWT-auth')
@Throttle({ default: { ttl: 60000, limit: 30 } })
@UseGuards(ClientAuthenticationGuard)
@Controller('booking/me')
export class BookingAccountController {
  constructor(
    @Inject(BOOKING_ACCOUNT_SERVICE)
    private readonly bookingAccountService: BookingAccountServiceInterface,
  ) {}

  @ApiGetClientProfile()
  @Get()
  async getProfile(@Request() req): Promise<ResponseDto> {
    return await this.bookingAccountService.getProfile(req.clientId);
  }

  @ApiUpdateClientProfile()
  @Put()
  async updateProfile(
    @Body() dto: UpdateClientProfileDto,
    @Request() req,
  ): Promise<ResponseDto> {
    return await this.bookingAccountService.updateProfile(req.clientId, dto);
  }

  @ApiFindAccountAppointments()
  @Get('appointments')
  async findAppointments(@Request() req): Promise<ResponseDto> {
    return await this.bookingAccountService.findAppointments(req.clientId);
  }

  @ApiCancelAccountAppointment()
  @Patch('appointments/:uuid/cancel')
  async cancelAppointment(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Body() dto: CancelManagedAppointmentDto,
    @Request() req,
  ): Promise<ResponseDto> {
    return await this.bookingAccountService.cancelAppointment(
      req.clientId,
      uuid,
      dto,
    );
  }

  @ApiRescheduleAccountAppointment()
  @Patch('appointments/:uuid/reschedule')
  async rescheduleAppointment(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Body() dto: RescheduleManagedAppointmentDto,
    @Request() req,
  ): Promise<ResponseDto> {
    return await this.bookingAccountService.rescheduleAppointment(
      req.clientId,
      uuid,
      dto,
    );
  }
}
