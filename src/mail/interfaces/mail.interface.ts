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
  sendAppointmentCreatedToClient(
    email: string,
    data: AppointmentMailData,
  ): Promise<void>;
  sendAppointmentCreatedToEmployee(
    email: string,
    data: AppointmentMailData,
  ): Promise<void>;
  sendAppointmentConfirmedToClient(
    email: string,
    data: AppointmentMailData,
  ): Promise<void>;
  sendAppointmentCancelledToClient(
    email: string,
    data: AppointmentCancelledMailData,
  ): Promise<void>;
  sendAppointmentCancelledToEmployee(
    email: string,
    data: AppointmentCancelledMailData,
  ): Promise<void>;
  sendAppointmentRescheduledToClient(
    email: string,
    data: AppointmentRescheduledMailData,
  ): Promise<void>;
  sendAppointmentRescheduledToEmployee(
    email: string,
    data: AppointmentRescheduledMailData,
  ): Promise<void>;
}

export interface AppointmentMailData {
  clientName: string;
  employeeName: string;
  serviceName: string;
  scheduledAt: Date;
  scheduledEndAt: Date;
  price: number;
  note?: string;
}

export interface AppointmentCancelledMailData extends AppointmentMailData {
  cancellationReason?: string;
  cancelledBy: string;
}

export interface AppointmentRescheduledMailData extends AppointmentMailData {
  previousScheduledAt: Date;
  previousScheduledEndAt: Date;
  rescheduledBy: string;
}

export const MAIL_SERVICE = 'MAIL_SERVICE';
