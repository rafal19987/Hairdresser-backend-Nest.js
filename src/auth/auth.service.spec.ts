import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RefreshToken } from '@/auth/entities/refresh-token.entity';
import { RevokedToken } from '@/auth/entities/revoked-token.entity';
import { User } from '@/users/entities/user.entity';
import { InvalidRefreshTokenException } from '@/auth/exceptions/invalid-refresh-token.exception';

describe('AuthService', () => {
  let service: AuthService;

  const refreshTokenRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  };

  const revokedTokenRepository = { findOne: jest.fn(), save: jest.fn() };
  const userRepository = { findOne: jest.fn() };

  const jwtService = {
    sign: jest.fn().mockReturnValue('new-access-token'),
    verify: jest.fn(),
    decode: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(RefreshToken),
          useValue: refreshTokenRepository,
        },
        {
          provide: getRepositoryToken(RevokedToken),
          useValue: revokedTokenRepository,
        },
        { provide: getRepositoryToken(User), useValue: userRepository },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('refreshTokens', () => {
    it('throws when token does not exist', async () => {
      refreshTokenRepository.findOne.mockResolvedValue(null);

      await expect(service.refreshTokens('token')).rejects.toBeInstanceOf(
        InvalidRefreshTokenException,
      );
    });

    it('rejects and deletes expired token', async () => {
      refreshTokenRepository.findOne.mockResolvedValue({
        token: 'token',
        expiryDate: new Date(Date.now() - 1000),
        user: { uuid: 'user-1', active: true },
      });

      await expect(service.refreshTokens('token')).rejects.toBeInstanceOf(
        InvalidRefreshTokenException,
      );
      expect(refreshTokenRepository.delete).toHaveBeenCalledWith({
        token: 'token',
      });
      expect(refreshTokenRepository.save).not.toHaveBeenCalled();
    });

    it('rejects token of inactive user', async () => {
      refreshTokenRepository.findOne.mockResolvedValue({
        token: 'token',
        expiryDate: new Date(Date.now() + 60000),
        user: { uuid: 'user-1', active: false },
      });

      await expect(service.refreshTokens('token')).rejects.toBeInstanceOf(
        InvalidRefreshTokenException,
      );
    });

    it('rotates valid token', async () => {
      refreshTokenRepository.findOne.mockResolvedValue({
        token: 'token',
        expiryDate: new Date(Date.now() + 60000),
        user: { uuid: 'user-1', active: true },
      });

      const result = await service.refreshTokens('token');

      expect(result.accessToken).toBe('new-access-token');
      expect(result.refreshToken).not.toBe('token');
      expect(refreshTokenRepository.save).toHaveBeenCalled();
      expect(refreshTokenRepository.delete).toHaveBeenCalledWith({
        token: 'token',
      });
    });
  });

  describe('signInUsingToken', () => {
    it('returns user without issuing a new access token', async () => {
      const user = { uuid: 'user-1', active: true };
      revokedTokenRepository.findOne.mockResolvedValue(null);
      jwtService.verify.mockReturnValue({ userId: 'user-1' });
      userRepository.findOne.mockResolvedValue(user);

      const result = await service.signInUsingToken('access-token');

      expect(result).toEqual({ user });
      expect(jwtService.sign).not.toHaveBeenCalled();
    });

    it('rejects revoked token', async () => {
      revokedTokenRepository.findOne.mockResolvedValue({ token: 'x' });

      await expect(
        service.signInUsingToken('access-token'),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });
});
