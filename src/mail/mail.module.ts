import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Salon } from '@/salon/entities/salon.entity';
import { MailService } from './mail.service';
import { MAIL_SERVICE } from '@/mail/interfaces/mail.interface';

@Module({
  imports: [TypeOrmModule.forFeature([Salon])],
  providers: [
    {
      provide: MAIL_SERVICE,
      useClass: MailService,
    },
    MailService,
  ],
  exports: [MAIL_SERVICE, MailService],
})
export class MailModule {}
