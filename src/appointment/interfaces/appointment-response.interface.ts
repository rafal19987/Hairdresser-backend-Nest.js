import { Appointment } from '@/appointment/entities/appointment.entity';

type AppointmentFields = Pick<
  Appointment,
  | 'uuid'
  | 'name'
  | 'status'
  | 'price'
  | 'duration'
  | 'note'
  | 'meetingLink'
  | 'eventLocalization'
  | 'clientEmail'
  | 'clientPhone'
  | 'scheduledAt'
  | 'scheduledEndAt'
  | 'cancelledBy'
  | 'cancelledAt'
  | 'cancellationReason'
  | 'rescheduledBy'
  | 'rescheduledAt'
  | 'previousScheduledAt'
  | 'previousScheduledEndAt'
  | 'deleted'
  | 'createdAt'
  | 'lastModifiedAt'
>;

export interface AppointmentCalendarResponse {
  uuid: string;
  name: string;
  color?: string;
}

export interface AppointmentClientResponse {
  uuid: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export interface AppointmentEmployeeResponse {
  uuid: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface AppointmentUserServiceResponse {
  uuid: string;
  price: number;
  duration: number;
  user: AppointmentEmployeeResponse | null;
  service: {
    uuid: string;
    name: string;
    description: string;
  } | null;
}

export interface AppointmentCreatedByResponse {
  uuid: string;
  firstName: string;
  lastName: string;
}

export interface AppointmentResponse extends AppointmentFields {
  calendar: AppointmentCalendarResponse | null;
  client: AppointmentClientResponse | null;
  userService: AppointmentUserServiceResponse | null;
  createdBy: AppointmentCreatedByResponse | null;
}
