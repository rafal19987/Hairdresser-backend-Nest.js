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

describe('ClientsService', () => {
  let service: ClientsService;

  const clientRepository = {
    findOneBy: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
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
      ],
    }).compile();

    service = module.get<ClientsService>(ClientsService);
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
});
