import { applyDecorators } from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { CreateAppointmentDto } from '@/appointment/dto/create-appointment.dto';
import { CreateInternalAppointmentDto } from '@/appointment/dto/create-internal-appointment.dto';
import { UpdateAppointmentDto } from '@/appointment/dto/update-appointment.dto';
import { CancelAppointmentDto } from '@/appointment/dto/cancel-appointment.dto';
import { RescheduleAppointmentDto } from '@/appointment/dto/reschedule-appointment.dto';

const UuidParam = (description = 'UUID kalendarza') =>
  ApiParam({
    name: 'uuid',
    description,
    type: String,
    example: '123e4567-e89b-12d3-a456-426614174000',
  });

const PaginationQuery = () =>
  applyDecorators(
    ApiQuery({ name: 'page', required: false, type: Number, example: 1 }),
    ApiQuery({ name: 'limit', required: false, type: Number, example: 10 }),
  );

export function ApiFindAllAppointments() {
  return applyDecorators(
    ApiOperation({ summary: 'Pobierz wszystkie wizyty' }),
    PaginationQuery(),
    ApiResponse({ status: 200, description: 'Lista wizyt' }),
  );
}

export function ApiFindAppointmentsByCalendar() {
  return applyDecorators(
    ApiOperation({ summary: 'Pobierz wizyty kalendarza' }),
    UuidParam('Calendar UUID'),
    PaginationQuery(),
    ApiResponse({ status: 200, description: 'Lista wizyt kalendarza' }),
  );
}

export function ApiFindOneAppointment() {
  return applyDecorators(
    ApiOperation({ summary: 'Pobierz wizytę po UUID' }),
    UuidParam('Appointment UUID'),
    ApiResponse({ status: 200, description: 'Wizyta znaleziona' }),
    ApiResponse({ status: 404, description: 'Wizyta nie znaleziona' }),
  );
}

export function ApiCreateAppointment() {
  return applyDecorators(
    ApiOperation({ summary: 'Utwórz rezerwację (klient)' }),
    ApiBody({ type: CreateAppointmentDto }),
    ApiResponse({ status: 201, description: 'Wizyta została utworzona' }),
    ApiResponse({ status: 400, description: 'Nieprawidłowe dane' }),
    ApiResponse({ status: 409, description: 'Termin jest zajęty' }),
  );
}

export function ApiCreateInternalAppointment() {
  return applyDecorators(
    ApiOperation({ summary: 'Utwórz spotkanie wewnętrzne (pracownik/admin)' }),
    ApiBody({ type: CreateInternalAppointmentDto }),
    ApiResponse({ status: 201, description: 'Spotkanie zostało utworzone' }),
    ApiResponse({ status: 409, description: 'Termin jest zajęty' }),
  );
}

export function ApiUpdateAppointment() {
  return applyDecorators(
    ApiOperation({ summary: 'Zaktualizuj wizytę' }),
    UuidParam('Appointment UUID'),
    ApiBody({ type: UpdateAppointmentDto }),
    ApiResponse({ status: 200, description: 'Wizyta zaktualizowana' }),
    ApiResponse({ status: 404, description: 'Wizyta nie znaleziona' }),
  );
}

export function ApiCancelAppointment() {
  return applyDecorators(
    ApiOperation({ summary: 'Anuluj wizytę' }),
    UuidParam('Appointment UUID'),
    ApiBody({ type: CancelAppointmentDto }),
    ApiResponse({ status: 200, description: 'Wizyta anulowana' }),
    ApiResponse({ status: 404, description: 'Wizyta nie znaleziona' }),
    ApiResponse({ status: 409, description: 'Wizyta jest już anulowana' }),
  );
}

export function ApiRescheduleAppointment() {
  return applyDecorators(
    ApiOperation({ summary: 'Przełóż wizytę' }),
    UuidParam('Appointment UUID'),
    ApiBody({ type: RescheduleAppointmentDto }),
    ApiResponse({ status: 200, description: 'Wizyta przełożona' }),
    ApiResponse({ status: 404, description: 'Wizyta nie znaleziona' }),
    ApiResponse({ status: 409, description: 'Termin jest zajęty' }),
  );
}

export function ApiDeleteAppointment() {
  return applyDecorators(
    ApiOperation({ summary: 'Usuń wizytę' }),
    UuidParam('Appointment UUID'),
    ApiResponse({ status: 200, description: 'Wizyta usunięta' }),
    ApiResponse({ status: 404, description: 'Wizyta nie znaleziona' }),
  );
}
