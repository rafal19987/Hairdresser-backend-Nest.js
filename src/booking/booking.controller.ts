import {
  Controller,
  Get,
  Inject,
  Param,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { ResponseDto } from '@/common/dto/response.dto';
import {
  BOOKING_SERVICE,
  BookingServiceInterface,
} from '@/booking/interfaces/booking-service.interface';
import { AvailableSlotsQueryDto } from '@/booking/dto/available-slots-query.dto';
import {
  ApiFindAvailableSlots,
  ApiFindBookableEmployees,
  ApiFindBookableServices,
} from '@/booking/decorators/booking-swagger.decorator';

@ApiTags('Booking')
@Controller('booking')
export class BookingController {
  constructor(
    @Inject(BOOKING_SERVICE)
    private readonly bookingService: BookingServiceInterface,
  ) {}

  @ApiFindAvailableSlots()
  // Clients browse day by day, so the global limit would be hit quickly
  @Throttle({ default: { ttl: 60000, limit: 60 } })
  @Get('slots')
  async findAvailableSlots(
    @Query() query: AvailableSlotsQueryDto,
  ): Promise<ResponseDto> {
    return await this.bookingService.findAvailableSlots(query);
  }

  @ApiFindBookableServices()
  @Throttle({ default: { ttl: 60000, limit: 60 } })
  @Get('services')
  async findBookableServices(): Promise<ResponseDto> {
    return await this.bookingService.findBookableServices();
  }

  @ApiFindBookableEmployees()
  @Throttle({ default: { ttl: 60000, limit: 60 } })
  @Get('services/:serviceId/employees')
  async findBookableEmployees(
    @Param('serviceId', ParseUUIDPipe) serviceId: string,
  ): Promise<ResponseDto> {
    return await this.bookingService.findBookableEmployees(serviceId);
  }
}
