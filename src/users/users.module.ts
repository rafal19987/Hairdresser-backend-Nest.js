import { forwardRef, Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UsersController } from './users.controller';
import { Role } from 'src/roles/entities/role.entity';
import { AuthModule } from 'src/auth/auth.module';
import { USERS_SERVICE } from './interfaces/users-service.interface';
import { RolesModule } from '../roles/roles.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Role]),
    forwardRef(() => AuthModule),
    forwardRef(() => RolesModule),
  ],
  providers: [
    {
      provide: USERS_SERVICE,
      useClass: UsersService,
    },
  ],
  controllers: [UsersController],
  exports: [USERS_SERVICE],
})
export class UsersModule {}
