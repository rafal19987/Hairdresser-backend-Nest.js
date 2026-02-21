import {applyDecorators} from '@nestjs/common';
import {ApiOperation, ApiResponse, ApiBody} from '@nestjs/swagger';
import {CreateAppointmentDto} from '@/appointment/dto/create-appointment.dto';

export function ApiCreateAppointment() {
    return applyDecorators(
        ApiOperation({summary: 'Utwórz nowe spotkanie', description: 'Tworzy nowe spotkanie w określonym kalendarzu'}),
        ApiBody({type: CreateAppointmentDto}),
        ApiResponse({status: 201, description: 'Spotkanie zostało utworzone'}),
        ApiResponse({status: 400, description: 'Nieprawidłowe dane wejściowe'}),
    );
}