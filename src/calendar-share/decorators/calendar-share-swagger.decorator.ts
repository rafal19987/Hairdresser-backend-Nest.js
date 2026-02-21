import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiParam, ApiBody, ApiQuery } from '@nestjs/swagger';
import { CreateCalendarShareDto } from '@/calendar-share/dto/create-calendar-share.dto';
import { UpdateCalendarShareDto } from '@/calendar-share/dto/update-calendar-share.dto';
import { UpdatePermissionDto } from '@/calendar-share/dto/update-permission.dto';
import { PaginatedResultDto } from '@/common/dto/paginated-result.dto';

const UuidParam = (description = 'UUID udostępnienia') => ApiParam({
    name: 'uuid',
    description,
    type: String,
    example: '123e4567-e89b-12d3-a456-426614174000',
});

const PaginationQuery = () => applyDecorators(
    ApiQuery({ name: 'page', required: false, type: Number, example: 1 }),
    ApiQuery({ name: 'limit', required: false, type: Number, example: 10 }),
);

export function ApiCreateCalendarShare() {
    return applyDecorators(
        ApiOperation({ summary: 'Udostępnij kalendarz', description: 'Udostępnia kalendarz innemu użytkownikowi z określonymi uprawnieniami' }),
        ApiBody({ type: CreateCalendarShareDto }),
        ApiResponse({ status: 201, description: 'Kalendarz został udostępniony pomyślnie' }),
        ApiResponse({ status: 400, description: 'Nieprawidłowe dane' }),
        ApiResponse({ status: 409, description: 'Kalendarz jest już udostępniony temu użytkownikowi' }),
    );
}

export function ApiFindAllCalendarShares() {
    return applyDecorators(
        ApiOperation({ summary: 'Pobierz wszystkie udostępnienia', description: 'Zwraca paginowaną listę wszystkich udostępnień kalendarzy' }),
        PaginationQuery(),
        ApiQuery({ name: 'query', required: false, type: String, description: 'Fraza do wyszukiwania' }),
        ApiResponse({ status: 200, description: 'Lista udostępnień została pobrana pomyślnie', type: PaginatedResultDto }),
    );
}

export function ApiFindMySharedCalendars() {
    return applyDecorators(
        ApiOperation({ summary: 'Pobierz kalendarze udostępnione zalogowanemu użytkownikowi', description: 'Zwraca listę kalendarzy udostępnionych zalogowanemu użytkownikowi' }),
        PaginationQuery(),
        ApiResponse({ status: 200, description: 'Lista udostępnionych kalendarzy została pobrana pomyślnie', type: PaginatedResultDto }),
    );
}

export function ApiFindSharesByCalendar() {
    return applyDecorators(
        ApiOperation({ summary: 'Pobierz udostępnienia dla kalendarza', description: 'Zwraca listę użytkowników, którym udostępniono określony kalendarz' }),
        ApiParam({ name: 'calendarId', description: 'UUID kalendarza', type: String, example: '123e4567-e89b-12d3-a456-426614174000' }),
        PaginationQuery(),
        ApiResponse({ status: 200, description: 'Lista udostępnień kalendarza została pobrana pomyślnie', type: PaginatedResultDto }),
    );
}

export function ApiCheckCalendarAccess() {
    return applyDecorators(
        ApiOperation({ summary: 'Sprawdź dostęp do kalendarza', description: 'Sprawdza czy zalogowany użytkownik ma dostęp do określonego kalendarza' }),
        ApiParam({ name: 'calendarId', description: 'UUID kalendarza', type: String, example: '123e4567-e89b-12d3-a456-426614174000' }),
        ApiResponse({ status: 200, description: 'Informacja o dostępie' }),
        ApiResponse({ status: 404, description: 'Brak dostępu do kalendarza' }),
    );
}

export function ApiFindOneCalendarShare() {
    return applyDecorators(
        ApiOperation({ summary: 'Pobierz udostępnienie po UUID', description: 'Zwraca szczegóły konkretnego udostępnienia' }),
        UuidParam(),
        ApiResponse({ status: 200, description: 'Udostępnienie znalezione pomyślnie' }),
        ApiResponse({ status: 404, description: 'Udostępnienie nie zostało znalezione' }),
    );
}

export function ApiUpdateCalendarShare() {
    return applyDecorators(
        ApiOperation({ summary: 'Zaktualizuj udostępnienie', description: 'Aktualizuje istniejące udostępnienie kalendarza' }),
        UuidParam(),
        ApiBody({ type: UpdateCalendarShareDto }),
        ApiResponse({ status: 200, description: 'Udostępnienie zostało zaktualizowane pomyślnie' }),
        ApiResponse({ status: 400, description: 'Nieprawidłowe dane' }),
        ApiResponse({ status: 404, description: 'Udostępnienie nie zostało znalezione' }),
    );
}

export function ApiDeleteCalendarShare() {
    return applyDecorators(
        ApiOperation({ summary: 'Usuń udostępnienie', description: 'Usuwa konkretne udostępnienie kalendarza' }),
        UuidParam(),
        ApiResponse({ status: 200, description: 'Udostępnienie zostało usunięte' }),
        ApiResponse({ status: 404, description: 'Udostępnienie nie zostało znalezione' }),
    );
}

export function ApiRevokeCalendarAccess() {
    return applyDecorators(
        ApiOperation({ summary: 'Cofnij dostęp do kalendarza', description: 'Dezaktywuje udostępnienie bez jego usuwania' }),
        UuidParam(),
        ApiResponse({ status: 200, description: 'Dostęp został cofnięty pomyślnie' }),
        ApiResponse({ status: 404, description: 'Udostępnienie nie zostało znalezione' }),
    );
}

export function ApiUpdateCalendarSharePermission() {
    return applyDecorators(
        ApiOperation({ summary: 'Zmień poziom uprawnień', description: 'Aktualizuje poziom dostępu do kalendarza w udostępnieniu' }),
        UuidParam(),
        ApiBody({ type: UpdatePermissionDto, description: 'Nowy poziom uprawnień (read, create, write, full)' }),
        ApiResponse({ status: 200, description: 'Uprawnienia zostały zaktualizowane' }),
        ApiResponse({ status: 400, description: 'Nieprawidłowy poziom uprawnień' }),
        ApiResponse({ status: 404, description: 'Udostępnienie nie zostało znalezione' }),
    );
}