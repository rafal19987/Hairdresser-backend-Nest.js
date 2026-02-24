import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Appointment } from './entities/appointment.entity';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';
import { APPOINTMENTS_SERVICE } from './interfaces/appointments-service.interface';
import { Calendar } from '@/calendar/entities/calendar.entity';
import { User } from '@/users/entities/user.entity';
import { Client } from '@/clients/entities/client.entity';
import { UsersServices } from '@/users-services/entities/users-services.entity';
import { AuthModule } from '@/auth/auth.module';
import { UsersModule } from '@/users/users.module';
import { CalendarModule } from '@/calendar/calendar.module';
import { ClientsModule } from '@/clients/clients.module';
import { UsersServicesModule } from '@/users-services/users-services.module';
import { MailModule } from '@/mail/mail.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Appointment,
      Calendar,
      User,
      Client,
      UsersServices,
    ]),
    forwardRef(() => AuthModule),
    forwardRef(() => UsersModule),
    forwardRef(() => CalendarModule),
    forwardRef(() => ClientsModule),
    forwardRef(() => UsersServicesModule),
    MailModule,
  ],
  providers: [
    {
      provide: APPOINTMENTS_SERVICE,
      useClass: AppointmentsService,
    },
  ],
  controllers: [AppointmentsController],
  exports: [APPOINTMENTS_SERVICE],
})
export class AppointmentsModule {}
