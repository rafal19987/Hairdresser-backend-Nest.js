import { forwardRef, Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersModule } from 'src/users/users.module';
import { RolesModule } from 'src/roles/roles.module';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from './constatns';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RefreshToken } from './entities/refresh-token.entity';
import { RevokedToken } from './entities/revoked-token.entity';
import { User } from '../users/entities/user.entity';
import { Role } from '../roles/entities/role.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([RevokedToken, RefreshToken, User, Role]),
    forwardRef(() => UsersModule),
    forwardRef(() => RolesModule),
    JwtModule.register({
      global: true,
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '10h' },
    }),
  ],
  providers: [AuthService],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
