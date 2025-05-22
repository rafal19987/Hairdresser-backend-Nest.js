import { Module } from '@nestjs/common';
import { ServicesService } from '@/services/services.service';
import { ServicesController } from '@/services/services.controller';
import { SERVICES_SERVICE } from '@/services/interfaces/services-service.interface';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Service } from '@/services/entities/service.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Service])],
  providers: [
    {
      provide: SERVICES_SERVICE,
      useClass: ServicesService,
    },
  ],
  controllers: [ServicesController],
  exports: [SERVICES_SERVICE],
})
export class ServicesModule {}
