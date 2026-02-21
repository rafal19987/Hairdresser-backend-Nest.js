import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiParam, ApiBody, ApiQuery } from '@nestjs/swagger';
import { CreateCalendarDto } from '@/calendar/dto/create-calendar.dto';
import { UpdateCalendarDto } from '@/calendar/dto/update-calendar.dto';
import { PaginatedResultDto } from '@/common/dto/paginated-result.dto';

const UuidParam = (description = 'UUID kalendarza') => ApiParam({
    name: 'uuid',
    description,
    type: String,
    example: '123e4567-e89b-12d3-a456-426614174000',
});

const PaginationQuery = () => applyDecorators(
    ApiQuery({ name: 'page', required: false, type: Number, example: 1 }),
    ApiQuery({ name: 'limit', required: false, type: Number, example: 10 }),
);

export function ApiCreateCalendar() {
    return applyDecorators(
        ApiOperation({ summary: 'Utwórz nowy kalendarz', description: 'Tworzy nowy kalendarz dla użytkownika' }),
        ApiBody({ type: CreateCalendarDto }),
        ApiResponse({ status: 201, description: 'Kalendarz został utworzony pomyślnie' }),
        ApiResponse({ status: 400, description: 'Nieprawidłowe dane' }),
        ApiResponse({ status: 409, description: 'Kalendarz o tej nazwie już istnieje dla tego użytkownika' }),
    );
}

export function ApiFindAllCalendars() {
    return applyDecorators(
        ApiOperation({ summary: 'Pobierz wszystkie kalendarze', description: 'Zwraca paginowaną listę wszystkich aktywnych kalendarzy' }),
        PaginationQuery(),
        ApiQuery({ name: 'query', required: false, type: String, description: 'Fraza do wyszukiwania' }),
        ApiResponse({ status: 200, description: 'Lista kalendarzy została pobrana pomyślnie', type: PaginatedResultDto }),
    );
}

export function ApiFindMyCalendars() {
    return applyDecorators(
        ApiOperation({ summary: 'Pobierz kalendarze zalogowanego użytkownika', description: 'Zwraca paginowaną listę kalendarzy należących do zalogowanego użytkownika' }),
        PaginationQuery(),
        ApiResponse({ status: 200, description: 'Lista kalendarzy użytkownika została pobrana pomyślnie', type: PaginatedResultDto }),
    );
}

export function ApiFindCalendarsByOwner() {
    return applyDecorators(
        ApiOperation({ summary: 'Pobierz kalendarze według właściciela', description: 'Zwraca paginowaną listę kalendarzy należących do określonego użytkownika' }),
        ApiParam({ name: 'ownerId', description: 'UUID właściciela', type: String, example: '123e4567-e89b-12d3-a456-426614174000' }),
        PaginationQuery(),
        ApiResponse({ status: 200, description: 'Lista kalendarzy użytkownika została pobrana pomyślnie', type: PaginatedResultDto }),
    );
}

export function ApiFindOneCalendar() {
    return applyDecorators(
        ApiOperation({ summary: 'Pobierz kalendarz po UUID', description: 'Zwraca szczegóły konkretnego kalendarza' }),
        UuidParam(),
        ApiResponse({ status: 200, description: 'Kalendarz znaleziony pomyślnie' }),
        ApiResponse({ status: 404, description: 'Kalendarz nie został znaleziony' }),
    );
}

export function ApiUpdateCalendar() {
    return applyDecorators(
        ApiOperation({ summary: 'Zaktualizuj kalendarz', description: 'Aktualizuje istniejący kalendarz' }),
        UuidParam(),
        ApiBody({ type: UpdateCalendarDto }),
        ApiResponse({ status: 200, description: 'Kalendarz został zaktualizowany pomyślnie' }),
        ApiResponse({ status: 400, description: 'Nieprawidłowe dane' }),
        ApiResponse({ status: 404, description: 'Kalendarz nie został znaleziony' }),
    );
}

export function ApiSetDefaultCalendar() {
    return applyDecorators(
        ApiOperation({ summary: 'Ustaw kalendarz jako domyślny', description: 'Ustawia wybrany kalendarz jako domyślny dla użytkownika' }),
        UuidParam(),
        ApiResponse({ status: 200, description: 'Kalendarz został ustawiony jako domyślny' }),
        ApiResponse({ status: 404, description: 'Kalendarz nie został znaleziony' }),
    );
}

export function ApiSoftDeleteCalendar() {
    return applyDecorators(
        ApiOperation({ summary: 'Usuń kalendarz (soft delete)', description: 'Oznacza kalendarz jako usunięty bez usuwania z bazy danych' }),
        UuidParam(),
        ApiResponse({ status: 202, description: 'Kalendarz został usunięty pomyślnie' }),
        ApiResponse({ status: 404, description: 'Kalendarz nie został znaleziony' }),
    );
}

export function ApiDeleteCalendar() {
    return applyDecorators(
        ApiOperation({ summary: 'Usuń kalendarz trwale', description: 'Trwale usuwa kalendarz z bazy danych' }),
        UuidParam(),
        ApiResponse({ status: 200, description: 'Kalendarz został trwale usunięty' }),
        ApiResponse({ status: 404, description: 'Kalendarz nie został znaleziony' }),
    );
}

export function ApiRestoreCalendar() {
    return applyDecorators(
        ApiOperation({ summary: 'Przywróć usunięty kalendarz', description: 'Przywraca wcześniej usunięty kalendarz' }),
        UuidParam(),
        ApiResponse({ status: 200, description: 'Kalendarz został przywrócony pomyślnie' }),
        ApiResponse({ status: 400, description: 'Kalendarz nie jest usunięty' }),
        ApiResponse({ status: 404, description: 'Kalendarz nie został znaleziony' }),
    );
}