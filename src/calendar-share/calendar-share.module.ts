import { forwardRef, Module } from '@nestjs/common';
import { CalendarShareService } from './calendar-share.service';
import { CalendarShareController } from './calendar-share.controller';
import { CALENDAR_SHARE_SERVICE } from '@/calendar-share/interfaces/calendar-share-service.interface';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CalendarShare } from '@/calendar-share/entities/calendar-share.entity';
import { User } from '@/users/entities/user.entity';
import { Calendar } from '@/calendar/entities/calendar.entity';
import { AuthModule } from '@/auth/auth.module';
import { UsersModule } from '@/users/users.module';
import { CalendarModule } from '@/calendar/calendar.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CalendarShare, User, Calendar]),
    forwardRef(() => AuthModule),
    forwardRef(() => UsersModule),
    forwardRef(() => CalendarModule),
  ],
  controllers: [CalendarShareController],
  providers: [
    {
      provide: CALENDAR_SHARE_SERVICE,
      useClass: CalendarShareService,
    },
  ],
  exports: [CALENDAR_SHARE_SERVICE],
})
export class CalendarShareModule {}
