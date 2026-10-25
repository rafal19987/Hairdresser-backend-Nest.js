import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  CancelManagedAppointmentDto,
  RescheduleManagedAppointmentDto,
} from '@/booking/dto/manage-booking.dto';
import { UpdateClientProfileDto } from '@/booking/dto/update-client-profile.dto';

const Unauthorized = () =>
  ApiResponse({
    status: 401,
    description: 'Missing or invalid client token, or inactive account',
  });

export function ApiGetClientProfile() {
  return applyDecorators(
    ApiOperation({ summary: 'Get logged-in client profile' }),
    ApiResponse({ status: 200, description: 'Profile retrieved' }),
    Unauthorized(),
  );
}

export function ApiUpdateClientProfile() {
  return applyDecorators(
    ApiOperation({ summary: 'Update logged-in client profile' }),
    ApiBody({ type: UpdateClientProfileDto }),
    ApiResponse({ status: 200, description: 'Profile updated' }),
    ApiResponse({ status: 400, description: 'Validation error' }),
    Unauthorized(),
  );
}

export function ApiFindAccountAppointments() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get appointments of the logged-in client',
      description:
        'Same response as the emailed link: upcoming and history for the account email.',
    }),
    ApiResponse({ status: 200, description: 'Appointments retrieved' }),
    Unauthorized(),
  );
}

export function ApiCancelAccountAppointment() {
  return applyDecorators(
    ApiOperation({ summary: 'Cancel appointment of the logged-in client' }),
    ApiBody({ type: CancelManagedAppointmentDto }),
    ApiResponse({ status: 200, description: 'Appointment cancelled' }),
    Unauthorized(),
    ApiResponse({ status: 404, description: 'Appointment not found' }),
    ApiResponse({
      status: 409,
      description: 'Cancellation deadline passed or appointment is finished',
    }),
  );
}

export function ApiFindAccountRescheduleSlots() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get reschedule slots for appointment of the logged-in client',
      description:
        'Free slots of the same employee and service for one day. The appointment itself does not block its own time.',
    }),
    ApiResponse({ status: 200, description: 'Slots found' }),
    Unauthorized(),
    ApiResponse({ status: 404, description: 'Appointment not found' }),
    ApiResponse({
      status: 409,
      description: 'Change deadline passed or appointment is finished',
    }),
  );
}

export function ApiRescheduleAccountAppointment() {
  return applyDecorators(
    ApiOperation({
      summary: 'Reschedule appointment of the logged-in client',
      description:
        'Moves the appointment to another slot with the same employee. Client booking rules apply.',
    }),
    ApiBody({ type: RescheduleManagedAppointmentDto }),
    ApiResponse({ status: 200, description: 'Appointment rescheduled' }),
    ApiResponse({
      status: 400,
      description: 'New slot outside opening hours, too soon or too far ahead',
    }),
    Unauthorized(),
    ApiResponse({ status: 404, description: 'Appointment not found' }),
    ApiResponse({
      status: 409,
      description:
        'Change deadline passed, appointment is finished or new slot is taken',
    }),
  );
}
