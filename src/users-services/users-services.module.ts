import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersServices } from '@/users-services/entities/users-services.entity';
import { User } from '@/users/entities/user.entity';
import { Service } from '@/services/entities/service.entity';
import { AuthModule } from '@/auth/auth.module';
import { UsersModule } from '@/users/users.module';
import { ServicesModule } from '@/services/services.module';
import { USERS_SERVICES_SERVICE } from '@/users-services/interfaces/users-services-service.interface';
import { UsersServicesService } from '@/users-services/users-services.service';
import { UsersServicesController } from '@/users-services/users-services.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([UsersServices, User, Service]),
    forwardRef(() => AuthModule),
    forwardRef(() => UsersModule),
    forwardRef(() => ServicesModule),
  ],
  providers: [
    {
      provide: USERS_SERVICES_SERVICE,
      useClass: UsersServicesService,
    },
  ],
  controllers: [UsersServicesController],
  exports: [USERS_SERVICES_SERVICE],
})
export class UsersServicesModule {}
