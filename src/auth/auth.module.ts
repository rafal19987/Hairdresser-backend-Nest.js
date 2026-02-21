import { forwardRef, Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersModule } from 'src/users/users.module';
import { RolesModule } from 'src/roles/roles.module';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RefreshToken } from './entities/refresh-token.entity';
import { RevokedToken } from './entities/revoked-token.entity';
import { User } from '@/users/entities/user.entity';
import { Role } from '@/roles/entities/role.entity';
import {ConfigModule, ConfigService} from "@nestjs/config";
import {StringValue} from "ms";

@Module({
  imports: [
    TypeOrmModule.forFeature([RevokedToken, RefreshToken, User, Role]),
    forwardRef(() => UsersModule),
    forwardRef(() => RolesModule),
      JwtModule.registerAsync({
          imports: [ConfigModule],
          useFactory: async (configService: ConfigService) => ({
              global: true,
              secret: configService.get<string>('JWT_ACCESS_TOKEN_SECRET_KEY'),
              signOptions: {
                  expiresIn: configService.get<StringValue>('JWT_ACCESS_TOKEN_EXPIRES_IN'),
              },
          }),
          inject: [ConfigService],
    }),
  ],
  providers: [AuthService],
  controllers: [AuthController],
    exports: [AuthService, JwtModule],
})
export class AuthModule {}
