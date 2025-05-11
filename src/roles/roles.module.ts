import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Role } from './entities/role.entity';
import { RolesController } from './roles.controller';
import { RolesService } from './roles.service';
import { ROLES_SERVICE } from './interfaces/role-service.interface';
import { AuthModule } from '../auth/auth.module';
import { AuthenticationGuard } from '../guards/authentication.guard';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Role]),
    forwardRef(() => AuthModule),
    forwardRef(() => UsersModule),
  ],
  providers: [
    {
      provide: ROLES_SERVICE,
      useClass: RolesService,
    },
    AuthenticationGuard,
  ],
  controllers: [RolesController],
  exports: [ROLES_SERVICE],
})
export class RolesModule {}
