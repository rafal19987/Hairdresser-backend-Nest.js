import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { hash } from 'bcrypt';
import {
  AuthClientService,
  CLIENT_REFRESH_TOKEN_TTL_DAYS,
} from './auth-client.service';
import { Client } from '@/clients/entities/client.entity';
import { ClientRefreshToken } from '@/auth-client/entities/client-refresh-token.entity';
import { InvalidCredentialsException } from '@/auth/exceptions/invalid-credentials.exception';
import { InvalidRefreshTokenException } from '@/auth/exceptions/invalid-refresh-token.exception';
import { ClientEmailNotVerifiedException } from '@/clients/exceptions/client-email-not-verified.exception';

describe('AuthClientService', () => {
  let service: AuthClientService;
  let passwordHash: string;

  const queryBuilder = {
    addSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    getOne: jest.fn(),
  };

  const clientRepository = {
    createQueryBuilder: jest.fn(() => queryBuilder),
    findOneBy: jest.fn(),
  };

  const clientRefreshTokenRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  };

  const jwtService = { sign: jest.fn().mockReturnValue('access-token') };
  const configService = { get: jest.fn().mockReturnValue('secret') };

  beforeAll(async () => {
    passwordHash = await hash('Password123', 4);
  });

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthClientService,
        { provide: getRepositoryToken(Client), useValue: clientRepository },
        {
          provide: getRepositoryToken(ClientRefreshToken),
          useValue: clientRefreshTokenRepository,
        },
        { provide: JwtService, useValue: jwtService },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get<AuthClientService>(AuthClientService);
  });

  describe('login', () => {
    it('throws InvalidCredentials for wrong password even if email is not verified', async () => {
      queryBuilder.getOne.mockResolvedValue({
        uuid: 'client-1',
        password: passwordHash,
        emailVerified: false,
        active: false,
      });

      await expect(
        service.login({ email: 'jan@example.com', password: 'wrong' }),
      ).rejects.toBeInstanceOf(InvalidCredentialsException);
    });

    it('throws EmailNotVerified only after password is correct', async () => {
      queryBuilder.getOne.mockResolvedValue({
        uuid: 'client-1',
        password: passwordHash,
        emailVerified: false,
        active: false,
      });

      await expect(
        service.login({ email: 'jan@example.com', password: 'Password123' }),
      ).rejects.toBeInstanceOf(ClientEmailNotVerifiedException);
    });

    it('returns tokens and stores refresh token with expiry date', async () => {
      queryBuilder.getOne.mockResolvedValue({
        uuid: 'client-1',
        password: passwordHash,
        emailVerified: true,
        active: true,
      });

      const result = await service.login({
        email: 'jan@example.com',
        password: 'Password123',
      });

      expect(result.accessToken).toBe('access-token');
      expect(result.client).not.toHaveProperty('password');

      const saved = clientRefreshTokenRepository.save.mock.calls[0][0];
      const expectedMin =
        Date.now() + (CLIENT_REFRESH_TOKEN_TTL_DAYS - 1) * 24 * 60 * 60 * 1000;
      expect(saved.expiryDate).toBeInstanceOf(Date);
      expect(saved.expiryDate.getTime()).toBeGreaterThan(expectedMin);
    });
  });

  describe('refreshTokens', () => {
    it('throws when token does not exist', async () => {
      clientRefreshTokenRepository.findOne.mockResolvedValue(null);

      await expect(service.refreshTokens('token')).rejects.toBeInstanceOf(
        InvalidRefreshTokenException,
      );
    });

    it('rejects and deletes expired token', async () => {
      clientRefreshTokenRepository.findOne.mockResolvedValue({
        token: 'token',
        expiryDate: new Date(Date.now() - 1000),
        client: { uuid: 'client-1', active: true },
      });

      await expect(service.refreshTokens('token')).rejects.toBeInstanceOf(
        InvalidRefreshTokenException,
      );
      expect(clientRefreshTokenRepository.delete).toHaveBeenCalledWith({
        token: 'token',
      });
      expect(clientRefreshTokenRepository.save).not.toHaveBeenCalled();
    });

    it('rejects legacy token without expiry date', async () => {
      clientRefreshTokenRepository.findOne.mockResolvedValue({
        token: 'token',
        expiryDate: null,
        client: { uuid: 'client-1', active: true },
      });

      await expect(service.refreshTokens('token')).rejects.toBeInstanceOf(
        InvalidRefreshTokenException,
      );
    });

    it('rejects token of inactive client', async () => {
      clientRefreshTokenRepository.findOne.mockResolvedValue({
        token: 'token',
        expiryDate: new Date(Date.now() + 60000),
        client: { uuid: 'client-1', active: false },
      });

      await expect(service.refreshTokens('token')).rejects.toBeInstanceOf(
        InvalidRefreshTokenException,
      );
    });

    it('rotates valid token', async () => {
      clientRefreshTokenRepository.findOne.mockResolvedValue({
        token: 'token',
        expiryDate: new Date(Date.now() + 60000),
        client: { uuid: 'client-1', active: true },
      });

      const result = await service.refreshTokens('token');

      expect(result.accessToken).toBe('access-token');
      expect(result.refreshToken).not.toBe('token');
      expect(clientRefreshTokenRepository.delete).toHaveBeenCalledWith({
        token: 'token',
      });
    });
  });
});
