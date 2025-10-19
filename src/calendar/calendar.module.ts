import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CalendarService } from './calendar.service';
import { CalendarController } from './calendar.controller';
import { Calendar } from './entities/calendar.entity';
import { User } from '@/users/entities/user.entity';
import { CALENDAR_SERVICE } from '@/calendar/interfaces/calendars-service.interface';
import { AuthModule } from '@/auth/auth.module';
import { UsersModule } from '@/users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Calendar, User]),
    forwardRef(() => AuthModule),
    forwardRef(() => UsersModule),
  ],
  controllers: [CalendarController],
  providers: [
    {
      provide: CALENDAR_SERVICE,
      useClass: CalendarService,
    },
  ],
  exports: [CALENDAR_SERVICE],
})
export class CalendarModule {}
