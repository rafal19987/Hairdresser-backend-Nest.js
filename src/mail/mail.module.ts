import { Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { MAIL_SERVICE } from '@/mail/interfaces/mail.interface';

@Module({
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
