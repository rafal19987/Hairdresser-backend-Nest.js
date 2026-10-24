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
import { BookingAccessModule } from '@/booking-access/booking-access.module';
import { MailModule } from '@/mail/mail.module';
import { BookingManageController } from '@/booking/booking-manage.controller';
import { BookingManageService } from '@/booking/booking-manage.service';
import { BOOKING_MANAGE_SERVICE } from '@/booking/interfaces/booking-manage-service.interface';
import { BookingAccountController } from '@/booking/booking-account.controller';
import { BookingAccountService } from '@/booking/booking-account.service';
import { BOOKING_ACCOUNT_SERVICE } from '@/booking/interfaces/booking-account-service.interface';

@Module({
  imports: [
    TypeOrmModule.forFeature([Appointment, Service, UsersServices, Client]),
    SalonModule,
    AppointmentsModule,
    BookingAccessModule,
    MailModule,
    // Client token guard passes the client secret explicitly
    JwtModule.register({}),
  ],
  providers: [
    {
      provide: BOOKING_SERVICE,
      useClass: BookingService,
    },
    {
      provide: BOOKING_MANAGE_SERVICE,
      useClass: BookingManageService,
    },
    {
      provide: BOOKING_ACCOUNT_SERVICE,
      useClass: BookingAccountService,
    },
  ],
  controllers: [
    BookingController,
    BookingManageController,
    BookingAccountController,
  ],
  exports: [BOOKING_SERVICE],
})
export class BookingModule {}
