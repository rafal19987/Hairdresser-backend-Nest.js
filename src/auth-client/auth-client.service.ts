import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { compare } from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { Client } from '@/clients/entities/client.entity';
import { ClientRefreshToken } from '@/auth-client/entities/client-refresh-token.entity';
import { ClientLoginDto } from './dto/client-login.dto';
import { InvalidCredentialsException } from '@/auth/exceptions/invalid-credentials.exception';
import { InvalidRefreshTokenException } from '@/auth/exceptions/invalid-refresh-token.exception';
import { ClientEmailNotVerifiedException } from '@/clients/exceptions/client-email-not-verified.exception';
import { StringValue } from 'ms';
import { ClientNotFoundException } from '@/clients/exceptions/client-not-found.exception';

@Injectable()
export class AuthClientService {
  constructor(
    @InjectRepository(Client)
    private readonly clientRepository: Repository<Client>,
    @InjectRepository(ClientRefreshToken)
    private readonly clientRefreshTokenRepository: Repository<ClientRefreshToken>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async login(clientLoginDto: ClientLoginDto): Promise<{
    accessToken: string;
    refreshToken: string;
    client: Omit<Client, 'password'>;
  }> {
    const client = await this.clientRepository
      .createQueryBuilder('client')
      .addSelect('client.password')
      .where('client.email = :email', { email: clientLoginDto.email })
      .getOne();

    if (!client) throw new InvalidCredentialsException();

    if (!client.emailVerified) throw new ClientEmailNotVerifiedException();

    if (!client.active) throw new InvalidCredentialsException();

    const isPasswordValid = await compare(
      clientLoginDto.password,
      client.password,
    );

    if (!isPasswordValid) throw new InvalidCredentialsException();

    const tokens = await this._generateTokens(client.uuid);

    const { password, ...result } = client;

    return { ...tokens, client: result };
  }

  async refreshTokens(
    refreshToken: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const existingToken = await this.clientRefreshTokenRepository.findOne({
      where: { token: refreshToken },
      relations: ['client'],
    });

    if (!existingToken) throw new InvalidRefreshTokenException();

    const newTokens = await this._generateTokens(existingToken.client.uuid);

    await this.clientRefreshTokenRepository.delete({ token: refreshToken });

    return newTokens;
  }

  async logout(refreshToken: string): Promise<void> {
    const result = await this.clientRefreshTokenRepository.delete({
      token: refreshToken,
    });

    if (!result.affected) throw new InvalidRefreshTokenException();
  }

  private async _generateTokens(
    clientId: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const accessToken = this.jwtService.sign(
      { clientId, type: 'client' },
      {
        secret: this.configService.get<string>(
          'JWT_CLIENT_ACCESS_TOKEN_SECRET_KEY',
        ),
        expiresIn: this.configService.get<StringValue>(
          'JWT_ACCESS_TOKEN_EXPIRES_IN',
        ),
      },
    );

    const refreshToken = crypto.randomUUID();

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 7);

    const client = { uuid: clientId } as Client;

    await this.clientRefreshTokenRepository.save({
      token: refreshToken,
      client,
    });

    return { accessToken, refreshToken };
  }

  public async saveRefreshToken(
    clientUuid: string,
    token: string,
  ): Promise<void> {
    const client = await this.clientRepository.findOneBy({ uuid: clientUuid });

    if (!client) throw new ClientNotFoundException();

    await this.clientRefreshTokenRepository.save({ client, token });
  }

  public async removeRefreshToken(token: string): Promise<void> {
    await this.clientRefreshTokenRepository.delete({ token });
  }

  public async findRefreshToken(
    token: string,
  ): Promise<ClientRefreshToken | null> {
    return this.clientRefreshTokenRepository.findOne({
      where: { token },
      relations: ['client'],
    });
  }
}
