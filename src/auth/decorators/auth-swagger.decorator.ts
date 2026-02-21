import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBody, ApiParam } from '@nestjs/swagger';
import { LoginDto } from '@/auth/dto/login.dto';
import { SetPasswordDto } from '@/auth/dto/set-password.dto';

export function ApiLogin() {
    return applyDecorators(
      ApiOperation({
        summary: 'Zaloguj użytkownika',
        description: 'Logowanie za pomocą email i hasła',
      }),
      ApiBody({ type: LoginDto }),
      ApiResponse({ status: 200, description: 'Zalogowano pomyślnie' }),
      ApiResponse({ status: 400, description: 'Nieprawidłowe dane' }),
      ApiResponse({ status: 401, description: 'Błędny login lub hasło' }),
      ApiResponse({ status: 429, description: 'Zbyt wiele prób logowania' }),
    );
}

export function ApiLogout() {
    return applyDecorators(
      ApiOperation({ summary: 'Wyloguj użytkownika' }),
      ApiResponse({ status: 200, description: 'Wylogowano pomyślnie' }),
      ApiResponse({ status: 401, description: 'Nieprawidłowy token' }),
    );
}

export function ApiVerifyToken() {
  return applyDecorators(
    ApiOperation({
      summary: 'Weryfikuj token',
      description: 'Weryfikuje access token i zwraca dane użytkownika',
    }),
    ApiResponse({ status: 200, description: 'Token prawidłowy' }),
    ApiResponse({
      status: 401,
      description: 'Token nieprawidłowy lub wygasły',
    }),
  );
}

export function ApiGetProfile() {
  return applyDecorators(
    ApiOperation({
      summary: 'Pobierz profil',
      description: 'Zwraca ID zalogowanego użytkownika',
    }),
    ApiResponse({ status: 200, description: 'Profil pobrany pomyślnie' }),
    ApiResponse({ status: 401, description: 'Brak autoryzacji' }),
  );
}

export function ApiSetPassword() {
  return applyDecorators(
    ApiOperation({ summary: 'Ustaw hasło' }),
    ApiParam({ name: 'token', description: 'Invitation token', type: String }),
    ApiBody({ type: SetPasswordDto }),
    ApiResponse({
      status: 200,
      description: 'Hasło zostało ustawione pomyślnie',
    }),
    ApiResponse({ status: 400, description: 'Hasła nie są identyczne' }),
    ApiResponse({
      status: 401,
      description: 'Token nieprawidłowy lub wygasły',
    }),
  );
}

export function ApiVerifyInvitation() {
  return applyDecorators(
    ApiOperation({ summary: 'Weryfikuj token zaproszenia' }),
    ApiParam({ name: 'token', description: 'Invitation token', type: String }),
    ApiResponse({ status: 200, description: 'Token prawidłowy' }),
    ApiResponse({
      status: 401,
      description: 'Token nieprawidłowy lub wygasły',
    }),
  );
}