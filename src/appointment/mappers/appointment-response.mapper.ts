import { Appointment } from '@/appointment/entities/appointment.entity';
import { AppointmentResponse } from '@/appointment/interfaces/appointment-response.interface';

export function toAppointmentResponse(
  appointment: Appointment,
): AppointmentResponse {
  const { calendar, client, userService, createdBy } = appointment;

  return {
    uuid: appointment.uuid,
    name: appointment.name,
    status: appointment.status,
    price: appointment.price,
    duration: appointment.duration,
    note: appointment.note,
    meetingLink: appointment.meetingLink,
    eventLocalization: appointment.eventLocalization,
    clientEmail: appointment.clientEmail,
    clientPhone: appointment.clientPhone,
    scheduledAt: appointment.scheduledAt,
    scheduledEndAt: appointment.scheduledEndAt,
    cancelledBy: appointment.cancelledBy,
    cancelledAt: appointment.cancelledAt,
    cancellationReason: appointment.cancellationReason,
    rescheduledBy: appointment.rescheduledBy,
    rescheduledAt: appointment.rescheduledAt,
    previousScheduledAt: appointment.previousScheduledAt,
    previousScheduledEndAt: appointment.previousScheduledEndAt,
    deleted: appointment.deleted,
    createdAt: appointment.createdAt,
    lastModifiedAt: appointment.lastModifiedAt,
    calendar: calendar
      ? { uuid: calendar.uuid, name: calendar.name, color: calendar.color }
      : null,
    client: client
      ? {
          uuid: client.uuid,
          firstName: client.firstName,
          lastName: client.lastName,
          email: client.email,
          phone: client.phone,
        }
      : null,
    userService: userService
      ? {
          uuid: userService.uuid,
          price: userService.price,
          duration: userService.duration,
          user: userService.user
            ? {
                uuid: userService.user.uuid,
                firstName: userService.user.firstName,
                lastName: userService.user.lastName,
                email: userService.user.email,
              }
            : null,
          service: userService.service
            ? {
                uuid: userService.service.uuid,
                name: userService.service.name,
                description: userService.service.description,
              }
            : null,
        }
      : null,
    createdBy: createdBy
      ? {
          uuid: createdBy.uuid,
          firstName: createdBy.firstName,
          lastName: createdBy.lastName,
        }
      : null,
  };
}
