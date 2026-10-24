import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Appointment } from '@/appointment/entities/appointment.entity';
import { Service } from '@/services/entities/service.entity';
import { UsersServices } from '@/users-services/entities/users-services.entity';
import { SalonModule } from '@/salon/salon.module';
import { BookingController } from '@/booking/booking.controller';
import { BookingService } from '@/booking/booking.service';
import { BOOKING_SERVICE } from '@/booking/interfaces/booking-service.interface';

@Module({
  imports: [
    TypeOrmModule.forFeature([Appointment, Service, UsersServices]),
    SalonModule,
  ],
  providers: [
    {
      provide: BOOKING_SERVICE,
      useClass: BookingService,
    },
  ],
  controllers: [BookingController],
  exports: [BOOKING_SERVICE],
})
export class BookingModule {}
