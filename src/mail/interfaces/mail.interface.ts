export interface MailOptions {
  to: string;
  subject: string;
  html: string;
}

export interface MailServiceInterface {
  send(options: MailOptions): Promise<void>;
  sendInvitation(email: string, invitationToken: string): Promise<void>;
  sendClientEmailVerification(
    email: string,
    verificationToken: string,
  ): Promise<void>;
}

export const MAIL_SERVICE = 'MAIL_SERVICE';
