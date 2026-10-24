import { createHash } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { LessThan, MoreThan } from 'typeorm';
import { BookingAccessService } from './booking-access.service';

const NOW = new Date('2026-11-01T08:00:00.000Z');

describe('BookingAccessService', () => {
  const tokenRepository = {
    delete: jest.fn(),
    save: jest.fn(),
    create: jest.fn(value => value),
    findOneBy: jest.fn(),
    update: jest.fn(),
  };
  let manageUrl: string | undefined;
  const configService = {
    get: jest.fn(() => manageUrl),
  } as unknown as ConfigService;
  const service = new BookingAccessService(
    tokenRepository as never,
    configService,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Date, 'now').mockReturnValue(NOW.getTime());
    manageUrl = 'http://localhost:3001/moje-wizyty/';
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns link with random token and stores only its hash', async () => {
    const url = await service.createManageUrl(' Jan@Example.com ');

    const token = url.split('/').pop();
    expect(url).toBe(`http://localhost:3001/moje-wizyty/${token}`);
    expect(token).toMatch(/^[\w-]{43}$/);

    const [saved] = tokenRepository.save.mock.calls[0];
    expect(saved).toEqual({
      email: 'jan@example.com',
      tokenHash: createHash('sha256').update(token).digest('hex'),
      expiresAt: new Date('2027-01-30T08:00:00.000Z'),
    });
    expect(JSON.stringify(saved)).not.toContain(token);
  });

  it('generates different tokens for every link', async () => {
    const first = await service.createManageUrl('jan@example.com');
    const second = await service.createManageUrl('jan@example.com');

    expect(first).not.toBe(second);
  });

  it('removes expired tokens of the email', async () => {
    await service.createManageUrl('jan@example.com');

    expect(tokenRepository.delete).toHaveBeenCalledWith({
      email: 'jan@example.com',
      expiresAt: LessThan(NOW),
    });
  });

  it('returns null when client site URL is not configured', async () => {
    manageUrl = undefined;

    expect(await service.createManageUrl('jan@example.com')).toBeNull();
    expect(tokenRepository.save).not.toHaveBeenCalled();
  });

  it('finds email by token hash and records usage', async () => {
    tokenRepository.findOneBy.mockResolvedValue({
      uuid: 'token-uuid',
      email: 'jan@example.com',
    });

    expect(await service.findEmailByToken('secret-token')).toBe(
      'jan@example.com',
    );
    expect(tokenRepository.findOneBy).toHaveBeenCalledWith({
      tokenHash: createHash('sha256').update('secret-token').digest('hex'),
      expiresAt: MoreThan(NOW),
    });
    expect(tokenRepository.update).toHaveBeenCalledWith('token-uuid', {
      lastUsedAt: NOW,
    });
  });

  it('returns null for unknown or expired token', async () => {
    tokenRepository.findOneBy.mockResolvedValue(null);

    expect(await service.findEmailByToken('secret-token')).toBeNull();
    expect(tokenRepository.update).not.toHaveBeenCalled();
  });
});
