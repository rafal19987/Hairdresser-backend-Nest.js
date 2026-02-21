export interface MailOptions {
  to: string;
  subject: string;
  html: string;
}

export interface MailServiceInterface {
  send(options: MailOptions): Promise<void>;
}

export const MAIL_SERVICE = 'MAIL_SERVICE';
