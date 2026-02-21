import { forwardRef, Module } from '@nestjs/common';
import { ServicesService } from '@/services/services.service';
import { ServicesController } from '@/services/services.controller';
import { SERVICES_SERVICE } from '@/services/interfaces/services-service.interface';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Service } from '@/services/entities/service.entity';
import { AuthModule } from '@/auth/auth.module';
import { UsersModule } from '@/users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Service]),
    forwardRef(() => AuthModule),
    forwardRef(() => UsersModule),
  ],
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
