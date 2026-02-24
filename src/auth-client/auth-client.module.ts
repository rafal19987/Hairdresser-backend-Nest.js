import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Client } from '@/clients/entities/client.entity';
import { ClientRefreshToken } from '@/auth-client/entities/client-refresh-token.entity';
import { ClientsModule } from '@/clients/clients.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { StringValue } from 'ms';
import { AuthClientService } from '@/auth-client/auth-client.service';
import { AuthClientController } from '@/auth-client/auth-client.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Client, ClientRefreshToken]),
    forwardRef(() => ClientsModule),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_CLIENT_ACCESS_TOKEN_SECRET_KEY'),
        signOptions: {
          expiresIn: configService.get<StringValue>(
            'JWT_ACCESS_TOKEN_EXPIRES_IN',
          ),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [AuthClientService],
  controllers: [AuthClientController],
  exports: [AuthClientService],
})
export class AuthClientModule {}
