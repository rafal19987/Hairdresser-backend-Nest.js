import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash, randomBytes } from 'crypto';
import { LessThan, MoreThan, Repository } from 'typeorm';
import { BookingAccessToken } from '@/booking-access/entities/booking-access-token.entity';

export const BOOKING_ACCESS_TOKEN_TTL_DAYS = 90;

const hashToken = (token: string): string =>
  createHash('sha256').update(token).digest('hex');

@Injectable()
export class BookingAccessService {
  constructor(
    @InjectRepository(BookingAccessToken)
    private readonly tokenRepository: Repository<BookingAccessToken>,
    private readonly configService: ConfigService,
  ) {}

  // Returns null when the client site URL is not configured
  public async createManageUrl(email: string): Promise<string | null> {
    const baseUrl = this.configService.get<string>('CLIENT_BOOKING_MANAGE_URL');
    if (!baseUrl) return null;

    const normalizedEmail = email.trim().toLowerCase();
    const token = randomBytes(32).toString('base64url');
    const now = Date.now();

    await this.tokenRepository.delete({
      email: normalizedEmail,
      expiresAt: LessThan(new Date(now)),
    });

    await this.tokenRepository.save(
      this.tokenRepository.create({
        email: normalizedEmail,
        tokenHash: hashToken(token),
        expiresAt: new Date(
          now + BOOKING_ACCESS_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
        ),
      }),
    );

    return `${baseUrl.replace(/\/+$/, '')}/${token}`;
  }

  public async findEmailByToken(token: string): Promise<string | null> {
    const accessToken = await this.tokenRepository.findOneBy({
      tokenHash: hashToken(token),
      expiresAt: MoreThan(new Date(Date.now())),
    });

    if (!accessToken) return null;

    await this.tokenRepository.update(accessToken.uuid, {
      lastUsedAt: new Date(Date.now()),
    });

    return accessToken.email;
  }
}
