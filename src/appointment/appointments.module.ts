import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Appointment } from './entities/appointment.entity';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';
import { APPOINTMENTS_SERVICE } from './interfaces/appointments-service.interface';
import { Calendar } from '@/calendar/entities/calendar.entity';
import { User } from '@/users/entities/user.entity';
import { AuthModule } from '@/auth/auth.module';
import { UsersModule } from '@/users/users.module';
import { CalendarModule } from '@/calendar/calendar.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Appointment, Calendar, User]),
    forwardRef(() => AuthModule),
    forwardRef(() => UsersModule),
    forwardRef(() => CalendarModule),
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
