import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsService } from './clients.service';
import { ClientsController } from './clients.controller';
import { CLIENTS_SERVICE } from './interfaces/clients-service.interface';
import { Client } from './entities/client.entity';
import { AuthModule } from '@/auth/auth.module';
import { MailModule } from '@/mail/mail.module';
import { AuthenticationGuard } from '@/guards/authentication.guard';
import { UsersModule } from '@/users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Client]),
    forwardRef(() => AuthModule),
    forwardRef(() => UsersModule),
    MailModule,
  ],
  providers: [
    {
      provide: CLIENTS_SERVICE,
      useClass: ClientsService,
    },
    ClientsService,
    AuthenticationGuard,
  ],
  controllers: [ClientsController],
  exports: [CLIENTS_SERVICE, ClientsService],
})
export class ClientsModule {}
