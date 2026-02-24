import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsService } from './clients.service';
import { ClientsController } from './clients.controller';
import { CLIENTS_SERVICE } from './interfaces/clients-service.interface';
import { Client } from './entities/client.entity';
import { AuthModule } from '@/auth/auth.module';
import { MailModule } from '@/mail/mail.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Client]),
    forwardRef(() => AuthModule),
    MailModule,
  ],
  providers: [
    {
      provide: CLIENTS_SERVICE,
      useClass: ClientsService,
    },
  ],
  controllers: [ClientsController],
  exports: [CLIENTS_SERVICE],
})
export class ClientsModule {}
