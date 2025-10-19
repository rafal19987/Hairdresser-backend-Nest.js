import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { DatabaseModule } from './database/database.module';
import { RolesModule } from './roles/roles.module';
import { ServicesModule } from '@/services/services.module';
import { CalendarModule } from './calendar/calendar.module';
import { CalendarShareModule } from './calendar-share/calendar-share.module';
import { AppointmentsModule } from '@/appointment/appointments.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      cache: true,
    }),
    DatabaseModule,
    RolesModule,
    AuthModule,
    UsersModule,
    ServicesModule,
    AppointmentsModule,
    CalendarModule,
    CalendarShareModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
