import { ConfigService } from '@nestjs/config';

export const CLIENT_TOKEN_TYPE = 'client';

// Client tokens must never be signed with the staff secret or an empty one
export const getClientAccessTokenSecret = (
  configService: ConfigService,
): string => {
  const secret = configService.get<string>('JWT_CLIENT_ACCESS_TOKEN_SECRET_KEY');

  if (!secret) {
    throw new Error('JWT_CLIENT_ACCESS_TOKEN_SECRET_KEY is not set');
  }

  return secret;
};
