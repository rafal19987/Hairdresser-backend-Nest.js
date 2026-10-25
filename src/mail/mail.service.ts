import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  AppointmentCancelledMailData,
  AppointmentMailData,
  AppointmentRescheduledMailData,
  MailBranding,
  MailOptions,
  MailServiceInterface,
} from '@/mail/interfaces/mail.interface';
import { MailTemplates } from '@/mail/templates/mail-templates';
import { MailtrapClient } from 'mailtrap';
import { Salon } from '@/salon/entities/salon.entity';
import { findDefaultSalon } from '@/salon/helpers/default-salon.helper';

const DEFAULT_BRANDING: MailBranding = {
  salonName: 'Rêve',
  timeZone: 'Europe/Warsaw',
  email: null,
  phone: null,
};

interface MailTemplate {
  subject: string;
  html: string;
}

@Injectable()
export class MailService implements MailServiceInterface {
  private readonly logger = new Logger(MailService.name);
  private client: MailtrapClient;

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(Salon)
    private readonly salonRepository: Repository<Salon>,
  ) {
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
          name: options.fromName ?? DEFAULT_BRANDING.salonName,
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

  async sendBookingManageLink(email: string, manageUrl: string): Promise<void> {
    await this._sendTemplate(email, branding =>
      MailTemplates.bookingManageLink(manageUrl, branding),
    );
  }

  async sendInvitation(email: string, invitationToken: string): Promise<void> {
    const appUrl = this.configService.get<string>('APP_URL');
    const link = `${appUrl}/set-password/${invitationToken}`;
    await this._sendTemplate(email, branding =>
      MailTemplates.invitation(link, branding),
    );
  }

  async sendClientEmailVerification(
    email: string,
    verificationToken: string,
  ): Promise<void> {
    const link = `${this._clientAccountUrl()}/weryfikacja/${verificationToken}`;
    await this._sendTemplate(email, branding =>
      MailTemplates.clientEmailVerification(link, branding),
    );
  }

  async sendClientPasswordReset(email: string, token: string): Promise<void> {
    const link = `${this._clientAccountUrl()}/reset-hasla/${token}`;
    await this._sendTemplate(email, branding =>
      MailTemplates.clientPasswordReset(link, branding),
    );
  }

  async sendAppointmentCreatedToClient(
    email: string,
    data: AppointmentMailData,
  ): Promise<void> {
    await this._sendTemplate(email, branding =>
      MailTemplates.appointmentCreatedToClient(data, branding),
    );
  }

  async sendAppointmentCreatedToEmployee(
    email: string,
    data: AppointmentMailData,
  ): Promise<void> {
    await this._sendTemplate(email, branding =>
      MailTemplates.appointmentCreatedToEmployee(data, branding),
    );
  }

  async sendAppointmentConfirmedToClient(
    email: string,
    data: AppointmentMailData,
  ): Promise<void> {
    await this._sendTemplate(email, branding =>
      MailTemplates.appointmentConfirmedToClient(data, branding),
    );
  }

  async sendAppointmentCancelledToClient(
    email: string,
    data: AppointmentCancelledMailData,
  ): Promise<void> {
    await this._sendTemplate(email, branding =>
      MailTemplates.appointmentCancelledToClient(data, branding),
    );
  }

  async sendAppointmentCancelledToEmployee(
    email: string,
    data: AppointmentCancelledMailData,
  ): Promise<void> {
    await this._sendTemplate(email, branding =>
      MailTemplates.appointmentCancelledToEmployee(data, branding),
    );
  }

  async sendAppointmentRescheduledToClient(
    email: string,
    data: AppointmentRescheduledMailData,
  ): Promise<void> {
    await this._sendTemplate(email, branding =>
      MailTemplates.appointmentRescheduledToClient(data, branding),
    );
  }

  async sendAppointmentRescheduledToEmployee(
    email: string,
    data: AppointmentRescheduledMailData,
  ): Promise<void> {
    await this._sendTemplate(email, branding =>
      MailTemplates.appointmentRescheduledToEmployee(data, branding),
    );
  }

  // Client account pages live on the public website, not in the admin panel
  private _clientAccountUrl(): string {
    const accountUrl =
      this.configService.get<string>('CLIENT_ACCOUNT_URL') ??
      `${this.configService.get<string>('WEBSITE_URL')}/konto`;

    return accountUrl.replace(/\/+$/, '');
  }

  private async _sendTemplate(
    to: string,
    build: (branding: MailBranding) => MailTemplate,
  ): Promise<void> {
    const branding = await this._getBranding();

    await this.send({ to, fromName: branding.salonName, ...build(branding) });
  }

  private async _getBranding(): Promise<MailBranding> {
    try {
      const salon = await findDefaultSalon(this.salonRepository);

      if (salon) {
        return {
          salonName: salon.name,
          timeZone: salon.timeZone,
          email: salon.email,
          phone: salon.phone,
        };
      }
    } catch (error) {
      this.logger.warn('Could not load salon settings for mail', error);
    }

    return DEFAULT_BRANDING;
  }
}
