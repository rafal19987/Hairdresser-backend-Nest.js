import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookingAccessToken } from '@/booking-access/entities/booking-access-token.entity';
import { BookingAccessService } from '@/booking-access/booking-access.service';
import { BookingAccessTokenGuard } from '@/booking-access/guards/booking-access-token.guard';

@Module({
  imports: [TypeOrmModule.forFeature([BookingAccessToken])],
  providers: [BookingAccessService, BookingAccessTokenGuard],
  exports: [BookingAccessService, BookingAccessTokenGuard],
})
export class BookingAccessModule {}
