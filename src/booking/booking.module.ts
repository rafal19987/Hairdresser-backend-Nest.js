import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { Appointment } from '@/appointment/entities/appointment.entity';
import { Service } from '@/services/entities/service.entity';
import { UsersServices } from '@/users-services/entities/users-services.entity';
import { SalonModule } from '@/salon/salon.module';
import { BookingController } from '@/booking/booking.controller';
import { BookingService } from '@/booking/booking.service';
import { BOOKING_SERVICE } from '@/booking/interfaces/booking-service.interface';
import { Client } from '@/clients/entities/client.entity';
import { AppointmentsModule } from '@/appointment/appointments.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Appointment, Service, UsersServices, Client]),
    SalonModule,
    AppointmentsModule,
    // Client token guard passes the client secret explicitly
    JwtModule.register({}),
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
