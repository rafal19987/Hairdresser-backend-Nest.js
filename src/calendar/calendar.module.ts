import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CalendarService } from './calendar.service';
import { CalendarController } from './calendar.controller';
import { Calendar } from './entities/calendar.entity';
import { User } from '@/users/entities/user.entity';
import { CALENDAR_SERVICE } from '@/calendar/interfaces/calendars-service.interface';
import { AuthModule } from '@/auth/auth.module';
import { UsersModule } from '@/users/users.module';
import { CalendarShare } from '@/calendar-share/entities/calendar-share.entity';
import { CalendarAccessService } from '@/calendar/calendar-access.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Calendar, User, CalendarShare]),
    forwardRef(() => AuthModule),
    forwardRef(() => UsersModule),
  ],
  controllers: [CalendarController],
  providers: [
    {
      provide: CALENDAR_SERVICE,
      useClass: CalendarService,
    },
    CalendarAccessService,
  ],
  exports: [CALENDAR_SERVICE, CalendarAccessService],
})
export class CalendarModule {}
