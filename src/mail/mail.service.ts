import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailServiceInterface } from '@/mail/interfaces/mail.interface';
import { MailOptions } from 'nodemailer/lib/smtp-pool';
import { MailTemplates } from '@/mail/templates/mail-templates';
import { MailtrapClient } from 'mailtrap';

@Injectable()
export class MailService implements MailServiceInterface {
  private readonly logger = new Logger(MailService.name);
  private client: MailtrapClient;

  constructor(private readonly configService: ConfigService) {
    const isSandbox =
      this.configService.get<string>('MAILTRAP_USE_SANDBOX') === 'true';
    const inboxId = isSandbox
      ? Number(this.configService.get<string>('MAILTRAP_INBOX_ID'))
      : undefined;

    this.client = new MailtrapClient({
      token: this.configService.get<string>('MAILTRAP_API_KEY'),
      sandbox: isSandbox,
      testInboxId: inboxId,
    });
  }

  async send(options: MailOptions): Promise<void> {
    try {
      await this.client.send({
        from: {
          name: 'Rêve',
          email: this.configService.get<string>('MAIL_FROM') as string,
        },
        to: [{ email: options.to as string }],
        subject: options.subject as string,
        html: options.html as string,
      });
      this.logger.log(`Email sent to ${options.to} — ${options.subject}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${options.to}`, error);
      throw error;
    }
  }

  async sendInvitation(email: string, token: string): Promise<void> {
    const appUrl = this.configService.get<string>('APP_URL');
    const link = `${appUrl}/set-password?token=${token}`;
    const template = MailTemplates.invitation(link);

    await this.send({
      to: email,
      ...template,
    });
  }
}
