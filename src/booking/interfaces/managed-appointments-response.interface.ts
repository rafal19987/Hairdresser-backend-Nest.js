import { AppointmentStatus } from '@/appointment/enums/appointment-status.enum';

export interface ManagedAppointment {
  uuid: string;
  status: AppointmentStatus;
  startsAt: string;
  endsAt: string;
  serviceId: string | null;
  serviceName: string;
  employeeId: string | null;
  employeeName: string | null;
  price: number | null;
  duration: number;
  // Last moment the client can cancel or reschedule; null when no longer possible
  changeableUntil: string | null;
}

export interface ManagedAppointmentsResponse {
  email: string;
  upcoming: ManagedAppointment[];
  past: ManagedAppointment[];
}
