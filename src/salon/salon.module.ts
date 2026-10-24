import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '@/auth/auth.module';
import { UsersModule } from '@/users/users.module';
import { Salon } from '@/salon/entities/salon.entity';
import { SalonOpeningHours } from '@/salon/entities/salon-opening-hours.entity';
import { SalonSpecialDay } from '@/salon/entities/salon-special-day.entity';
import { SalonSpecialDayHours } from '@/salon/entities/salon-special-day-hours.entity';
import { SalonService } from '@/salon/salon.service';
import { SalonController } from '@/salon/salon.controller';
import { SALON_SERVICE } from '@/salon/interfaces/salon-service.interface';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Salon,
      SalonOpeningHours,
      SalonSpecialDay,
      SalonSpecialDayHours,
    ]),
    forwardRef(() => AuthModule),
    forwardRef(() => UsersModule),
  ],
  providers: [
    {
      provide: SALON_SERVICE,
      useClass: SalonService,
    },
  ],
  controllers: [SalonController],
  exports: [SALON_SERVICE],
})
export class SalonModule {}
