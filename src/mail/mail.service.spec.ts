import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { MailService } from './mail.service';
import { Salon } from '@/salon/entities/salon.entity';

describe('MailService', () => {
  let service: MailService;

  const mailtrapClient = { send: jest.fn() };
  const salonRepository = { find: jest.fn() };
  const config: Record<string, string> = {
    MAIL_FROM: 'noreply@hairdresser.com',
    CLIENT_ACCOUNT_URL: 'http://localhost:3001/konto/',
  };
  const configService = {
    get: jest.fn((key: string) => config[key]),
  };

  const mailData = {
    clientName: 'Jan Kowalski',
    employeeName: 'Anna Nowak',
    serviceName: 'Strzyżenie',
    scheduledAt: new Date('2026-11-02T10:00:00.000Z'),
    scheduledEndAt: new Date('2026-11-02T11:00:00.000Z'),
    price: 120,
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    mailtrapClient.send.mockResolvedValue(undefined);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailService,
        { provide: ConfigService, useValue: configService },
        { provide: getRepositoryToken(Salon), useValue: salonRepository },
      ],
    }).compile();

    service = module.get<MailService>(MailService);
    Object.assign(service, { client: mailtrapClient });
  });

  it('uses salon name, contact and time zone from settings', async () => {
    salonRepository.find.mockResolvedValue([
      {
        name: 'Studio Fryzur',
        timeZone: 'Europe/London',
        email: 'kontakt@studio.pl',
        phone: null,
      },
    ]);

    await service.sendAppointmentConfirmedToClient('jan@example.com', mailData);

    const [message] = mailtrapClient.send.mock.calls[0];
    expect(message.from).toEqual({
      name: 'Studio Fryzur',
      email: 'noreply@hairdresser.com',
    });
    expect(message.to).toEqual([{ email: 'jan@example.com' }]);
    expect(message.subject).toBe('Wizyta potwierdzona — Studio Fryzur');
    expect(message.html).toContain('kontakt@studio.pl');
    expect(message.html).toContain('10:00');
  });

  it('falls back to default branding when salon is not configured', async () => {
    salonRepository.find.mockResolvedValue([]);

    await service.sendAppointmentConfirmedToClient('jan@example.com', mailData);

    const [message] = mailtrapClient.send.mock.calls[0];
    expect(message.from.name).toBe('Rêve');
    expect(message.html).toContain('11:00');
  });

  it('still sends mail when salon settings cannot be loaded', async () => {
    salonRepository.find.mockRejectedValue(new Error('DB down'));

    await service.sendInvitation('anna@example.com', 'token');

    expect(mailtrapClient.send).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: 'Zaproszenie do systemu Rêve',
      }),
    );
  });

  it('rethrows delivery errors', async () => {
    salonRepository.find.mockResolvedValue([]);
    mailtrapClient.send.mockRejectedValue(new Error('SMTP error'));

    await expect(
      service.sendInvitation('anna@example.com', 'token'),
    ).rejects.toThrow('SMTP error');
  });

  it('links client email verification to the website account page', async () => {
    salonRepository.find.mockResolvedValue([]);

    await service.sendClientEmailVerification('ewa@example.com', 'token-123');

    const [message] = mailtrapClient.send.mock.calls[0];
    expect(message.html).toContain(
      'http:&#x2F;&#x2F;localhost:3001&#x2F;konto&#x2F;weryfikacja&#x2F;token-123',
    );
    expect(message.html).not.toContain('verify-email');
  });

  it('links client password reset to the website account page', async () => {
    salonRepository.find.mockResolvedValue([]);

    await service.sendClientPasswordReset('ewa@example.com', 'token-123');

    const [message] = mailtrapClient.send.mock.calls[0];
    expect(message.html).toContain(
      'http:&#x2F;&#x2F;localhost:3001&#x2F;konto&#x2F;reset-hasla&#x2F;token-123',
    );
  });
});
