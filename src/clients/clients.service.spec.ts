import { createHash } from 'crypto';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  ClientsService,
  EMAIL_VERIFICATION_TTL_HOURS,
} from './clients.service';
import { Client } from '@/clients/entities/client.entity';
import { MailService } from '@/mail/mail.service';
import { Appointment } from '@/appointment/entities/appointment.entity';
import { ClientNotFoundException } from '@/clients/exceptions/client-not-found.exception';
import { ClientVerificationTokenExpiredException } from '@/clients/exceptions/client-verification-token-expired.exception';
import { ClientPasswordResetTokenInvalidException } from '@/clients/exceptions/client-password-reset-token-invalid.exception';
import { ClientRefreshToken } from '@/auth-client/entities/client-refresh-token.entity';

describe('ClientsService', () => {
  let service: ClientsService;

  const clientRepository = {
    findOneBy: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
  };

  const clientRefreshTokenRepository = {
    delete: jest.fn(),
  };

  const linkQueryBuilder = {
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    execute: jest.fn(),
  };

  const appointmentRepository = {
    createQueryBuilder: jest.fn(() => linkQueryBuilder),
  };

  const mailService = {
    sendClientEmailVerification: jest.fn(),
    sendClientPasswordReset: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    linkQueryBuilder.execute.mockResolvedValue({ affected: 0 });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClientsService,
        { provide: getRepositoryToken(Client), useValue: clientRepository },
        { provide: MailService, useValue: mailService },
        {
          provide: getRepositoryToken(Appointment),
          useValue: appointmentRepository,
        },
        {
          provide: getRepositoryToken(ClientRefreshToken),
          useValue: clientRefreshTokenRepository,
        },
      ],
    }).compile();

    service = module.get<ClientsService>(ClientsService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('verifyEmail', () => {
    it('throws when token does not exist', async () => {
      clientRepository.findOneBy.mockResolvedValue(null);

      await expect(service.verifyEmail('token')).rejects.toBeInstanceOf(
        ClientNotFoundException,
      );
    });

    it('throws ClientVerificationTokenExpiredException when token is expired', async () => {
      const expiredDate = new Date(
        Date.now() - (EMAIL_VERIFICATION_TTL_HOURS + 1) * 60 * 60 * 1000,
      );
      clientRepository.findOneBy.mockResolvedValue({
        emailVerificationToken: 'token',
        emailVerificationDate: expiredDate,
      });

      await expect(service.verifyEmail('token')).rejects.toBeInstanceOf(
        ClientVerificationTokenExpiredException,
      );
      expect(clientRepository.save).not.toHaveBeenCalled();
    });

    it('activates client when token is valid', async () => {
      const client = {
        email: 'jan@example.com',
        emailVerificationToken: 'token',
        emailVerificationDate: new Date(),
        emailVerified: false,
        active: false,
      };
      clientRepository.findOneBy.mockResolvedValue(client);

      await service.verifyEmail('token');

      expect(clientRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          emailVerified: true,
          active: true,
          emailVerificationToken: null,
        }),
      );
    });
  });

  describe('resendVerification', () => {
    it('returns generic response and sends nothing when client does not exist', async () => {
      clientRepository.findOneBy.mockResolvedValue(null);

      const result = await service.resendVerification('none@example.com');

      expect(result.statusCode).toBe(200);
      expect(mailService.sendClientEmailVerification).not.toHaveBeenCalled();
    });

    it('returns the same response and sends nothing when client is already verified', async () => {
      clientRepository.findOneBy.mockResolvedValue({
        email: 'jan@example.com',
        emailVerified: true,
      });

      const unknown = await service.resendVerification('none@example.com');
      clientRepository.findOneBy.mockResolvedValue({
        email: 'jan@example.com',
        emailVerified: true,
      });
      const verified = await service.resendVerification('jan@example.com');

      expect(verified).toEqual(unknown);
      expect(mailService.sendClientEmailVerification).not.toHaveBeenCalled();
    });

    it('generates new token and sends email for unverified client', async () => {
      const oldDate = new Date('2020-01-01');
      const client = {
        email: 'jan@example.com',
        emailVerified: false,
        emailVerificationToken: 'old-token',
        emailVerificationDate: oldDate,
      };
      clientRepository.findOneBy.mockResolvedValue(client);

      await service.resendVerification('jan@example.com');

      expect(client.emailVerificationToken).not.toBe('old-token');
      expect(client.emailVerificationDate.getTime()).toBeGreaterThan(
        oldDate.getTime(),
      );
      expect(clientRepository.save).toHaveBeenCalledWith(client);
      expect(mailService.sendClientEmailVerification).toHaveBeenCalledWith(
        'jan@example.com',
        client.emailVerificationToken,
      );
    });
  });

  describe('guest appointments', () => {
    it('links guest appointments with the same email after verification', async () => {
      clientRepository.findOneBy.mockResolvedValue({
        uuid: 'client-uuid',
        email: 'Jan@Example.com',
        emailVerificationToken: 'token',
        emailVerificationDate: new Date(),
      });
      linkQueryBuilder.execute.mockResolvedValue({ affected: 2 });

      const result = await service.verifyEmail('token');

      expect(linkQueryBuilder.set).toHaveBeenCalledWith({
        client: { uuid: 'client-uuid' },
      });
      expect(linkQueryBuilder.where).toHaveBeenCalledWith('client_id IS NULL');
      expect(linkQueryBuilder.andWhere).toHaveBeenCalledWith(
        'LOWER(clientEmail) = :email',
        { email: 'jan@example.com' },
      );
      expect(result.data).toEqual({ linkedAppointments: 2 });
    });

    it('does not link anything when verification fails', async () => {
      clientRepository.findOneBy.mockResolvedValue(null);

      await expect(service.verifyEmail('token')).rejects.toBeDefined();
      expect(linkQueryBuilder.execute).not.toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('creates account even when verification email fails', async () => {
      clientRepository.findOneBy.mockResolvedValue(null);
      clientRepository.findOne.mockResolvedValue(null);
      clientRepository.save.mockImplementation(async client => ({
        uuid: 'client-uuid',
        ...client,
      }));
      mailService.sendClientEmailVerification.mockRejectedValue(
        new Error('SMTP'),
      );

      const result = await service.create({
        email: 'jan@example.com',
        password: 'Haslo1234!',
      });

      expect(result.statusCode).toBe(201);
      expect(result.data).not.toHaveProperty('password');
    });
  });

  describe('requestPasswordReset', () => {
    const genericMessage =
      'Jeśli konto z tym adresem istnieje, wysłaliśmy na niego link do zmiany hasła.';

    it('answers the same and sends nothing when account does not exist', async () => {
      clientRepository.findOneBy.mockResolvedValue(null);

      const result = await service.requestPasswordReset('nikt@example.com');

      expect(result.message).toBe(genericMessage);
      expect(clientRepository.update).not.toHaveBeenCalled();
      expect(mailService.sendClientPasswordReset).not.toHaveBeenCalled();
    });

    it('answers the same and sends nothing for deactivated account', async () => {
      clientRepository.findOneBy.mockResolvedValue({
        uuid: 'client-uuid',
        email: 'jan@example.com',
        active: false,
      });

      const result = await service.requestPasswordReset('jan@example.com');

      expect(result.message).toBe(genericMessage);
      expect(mailService.sendClientPasswordReset).not.toHaveBeenCalled();
    });

    it('stores only the token hash and mails the raw token', async () => {
      jest.spyOn(Date, 'now').mockReturnValue(Date.UTC(2026, 10, 1, 8));
      clientRepository.findOneBy.mockResolvedValue({
        uuid: 'client-uuid',
        email: 'jan@example.com',
        active: true,
      });

      const result = await service.requestPasswordReset('jan@example.com');

      const [email, token] = mailService.sendClientPasswordReset.mock.calls[0];
      expect(email).toBe('jan@example.com');
      expect(clientRepository.update).toHaveBeenCalledWith('client-uuid', {
        passwordResetTokenHash: createHash('sha256')
          .update(token)
          .digest('hex'),
        passwordResetExpiresAt: new Date(Date.UTC(2026, 10, 1, 9)),
      });
      expect(result.message).toBe(genericMessage);
    });

    it('answers the same when mail fails', async () => {
      clientRepository.findOneBy.mockResolvedValue({
        uuid: 'client-uuid',
        email: 'jan@example.com',
        active: true,
      });
      mailService.sendClientPasswordReset.mockRejectedValue(new Error('SMTP'));

      const result = await service.requestPasswordReset('jan@example.com');

      expect(result.message).toBe(genericMessage);
    });
  });

  describe('resetPassword', () => {
    it('rejects unknown or expired token', async () => {
      clientRepository.findOneBy.mockResolvedValue(null);

      await expect(
        service.resetPassword('token', 'NoweHaslo123!'),
      ).rejects.toBeInstanceOf(ClientPasswordResetTokenInvalidException);
      expect(clientRepository.update).not.toHaveBeenCalled();
    });

    it('looks the client up by token hash', async () => {
      clientRepository.findOneBy.mockResolvedValue(null);

      await service
        .resetPassword('token', 'NoweHaslo123!')
        .catch(() => undefined);

      expect(clientRepository.findOneBy).toHaveBeenCalledWith(
        expect.objectContaining({
          passwordResetTokenHash: createHash('sha256')
            .update('token')
            .digest('hex'),
          active: true,
        }),
      );
    });

    it('sets new password, clears token and signs out everywhere', async () => {
      clientRepository.findOneBy.mockResolvedValue({
        uuid: 'client-uuid',
        email: 'jan@example.com',
        emailVerified: true,
      });

      await service.resetPassword('token', 'NoweHaslo123!');

      const [, changes] = clientRepository.update.mock.calls[0];
      expect(changes).toEqual({
        password: expect.any(String),
        passwordResetTokenHash: null,
        passwordResetExpiresAt: null,
      });
      expect(changes.password).not.toBe('NoweHaslo123!');
      expect(clientRefreshTokenRepository.delete).toHaveBeenCalledWith({
        client: { uuid: 'client-uuid' },
      });
      expect(linkQueryBuilder.execute).not.toHaveBeenCalled();
    });

    it('verifies email and links guest appointments of unverified account', async () => {
      clientRepository.findOneBy.mockResolvedValue({
        uuid: 'client-uuid',
        email: 'jan@example.com',
        emailVerified: false,
      });

      await service.resetPassword('token', 'NoweHaslo123!');

      const [, changes] = clientRepository.update.mock.calls[0];
      expect(changes).toMatchObject({
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationDate: null,
      });
      expect(linkQueryBuilder.execute).toHaveBeenCalled();
    });
  });
});
