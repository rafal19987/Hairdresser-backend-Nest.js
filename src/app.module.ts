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
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { MailModule } from './mail/mail.module';
import { UsersServicesModule } from './users-services/users-services.module';
import { ClientsModule } from './clients/clients.module';
import { AuthClientModule } from './auth-client/auth-client.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 10,
      },
    ]),
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
    MailModule,
    UsersServicesModule,
    ClientsModule,
    AuthClientModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
