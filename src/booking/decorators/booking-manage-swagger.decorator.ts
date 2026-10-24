import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  CancelManagedAppointmentDto,
  RescheduleManagedAppointmentDto,
  SendManageLinkDto,
} from '@/booking/dto/manage-booking.dto';

const InvalidToken = () =>
  ApiResponse({
    status: 401,
    description: 'Missing, invalid or expired booking link token',
  });

export function ApiSendManageLink() {
  return applyDecorators(
    ApiOperation({
      summary: 'Send link to the client appointments page',
      description:
        'Public endpoint. Always returns 200; the link is mailed only when the email has appointments. Limited to 3 requests per minute.',
    }),
    ApiBody({ type: SendManageLinkDto }),
    ApiResponse({ status: 200, description: 'Request accepted' }),
  );
}

export function ApiFindManagedAppointments() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get appointments for the email from the booking link',
      description:
        'Upcoming appointments (soonest first) and history (newest first). changeableUntil is null when the client can no longer cancel or reschedule.',
    }),
    ApiResponse({ status: 200, description: 'Appointments retrieved' }),
    InvalidToken(),
  );
}

export function ApiCancelManagedAppointment() {
  return applyDecorators(
    ApiOperation({ summary: 'Cancel own appointment' }),
    ApiBody({ type: CancelManagedAppointmentDto }),
    ApiResponse({ status: 200, description: 'Appointment cancelled' }),
    InvalidToken(),
    ApiResponse({ status: 404, description: 'Appointment not found' }),
    ApiResponse({
      status: 409,
      description: 'Cancellation deadline passed or appointment is finished',
    }),
  );
}

export function ApiRescheduleManagedAppointment() {
  return applyDecorators(
    ApiOperation({
      summary: 'Reschedule own appointment',
      description:
        'Moves the appointment to another slot with the same employee. Client booking rules apply.',
    }),
    ApiBody({ type: RescheduleManagedAppointmentDto }),
    ApiResponse({ status: 200, description: 'Appointment rescheduled' }),
    ApiResponse({
      status: 400,
      description: 'New slot outside opening hours, too soon or too far ahead',
    }),
    InvalidToken(),
    ApiResponse({ status: 404, description: 'Appointment not found' }),
    ApiResponse({
      status: 409,
      description:
        'Change deadline passed, appointment is finished or new slot is taken',
    }),
  );
}
