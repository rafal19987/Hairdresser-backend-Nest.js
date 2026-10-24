import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiHeader, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { ResponseDto } from '@/common/dto/response.dto';
import {
  BOOKING_MANAGE_SERVICE,
  BookingManageServiceInterface,
} from '@/booking/interfaces/booking-manage-service.interface';
import {
  CancelManagedAppointmentDto,
  RescheduleManagedAppointmentDto,
  SendManageLinkDto,
} from '@/booking/dto/manage-booking.dto';
import {
  BOOKING_TOKEN_HEADER,
  BookingAccessTokenGuard,
} from '@/booking-access/guards/booking-access-token.guard';
import {
  ApiCancelManagedAppointment,
  ApiFindManagedAppointments,
  ApiRescheduleManagedAppointment,
  ApiSendManageLink,
} from '@/booking/decorators/booking-manage-swagger.decorator';

@ApiTags('Booking')
@Controller('booking/manage')
export class BookingManageController {
  constructor(
    @Inject(BOOKING_MANAGE_SERVICE)
    private readonly bookingManageService: BookingManageServiceInterface,
  ) {}

  @ApiSendManageLink()
  @Throttle({ default: { ttl: 60000, limit: 3 } })
  @HttpCode(HttpStatus.OK)
  @Post('link')
  async sendManageLink(@Body() dto: SendManageLinkDto): Promise<ResponseDto> {
    return await this.bookingManageService.sendManageLink(dto.email);
  }

  @ApiFindManagedAppointments()
  @ApiHeader({ name: BOOKING_TOKEN_HEADER, required: true })
  @Throttle({ default: { ttl: 60000, limit: 30 } })
  @UseGuards(BookingAccessTokenGuard)
  @Get('appointments')
  async findAppointments(@Request() req): Promise<ResponseDto> {
    return await this.bookingManageService.findAppointments(req.bookingEmail);
  }

  @ApiCancelManagedAppointment()
  @ApiHeader({ name: BOOKING_TOKEN_HEADER, required: true })
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @UseGuards(BookingAccessTokenGuard)
  @Patch('appointments/:uuid/cancel')
  async cancelAppointment(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Body() dto: CancelManagedAppointmentDto,
    @Request() req,
  ): Promise<ResponseDto> {
    return await this.bookingManageService.cancelAppointment(
      req.bookingEmail,
      uuid,
      dto,
    );
  }

  @ApiRescheduleManagedAppointment()
  @ApiHeader({ name: BOOKING_TOKEN_HEADER, required: true })
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @UseGuards(BookingAccessTokenGuard)
  @Patch('appointments/:uuid/reschedule')
  async rescheduleAppointment(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Body() dto: RescheduleManagedAppointmentDto,
    @Request() req,
  ): Promise<ResponseDto> {
    return await this.bookingManageService.rescheduleAppointment(
      req.bookingEmail,
      uuid,
      dto,
    );
  }
}
