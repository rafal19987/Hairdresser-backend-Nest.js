import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { ResponseDto } from '@/common/dto/response.dto';
import { ResponseHelper } from '@/common/helpers/response.helper';
import { PaginationParamsDto } from '@/common/dto/pagination-params.dto';
import { PaginatedResultDto } from '@/common/dto/paginated-result.dto';
import { createPaginatedResponse } from '@/common/helpers/pagination.helper';
import { Client } from '@/clients/entities/client.entity';
import { ClientRefreshToken } from '@/auth-client/entities/client-refresh-token.entity';
import { ClientsServiceInterface } from '@/clients/interfaces/clients-service.interface';
import { CreateClientDto } from '@/clients/dto/create-client.dto';
import { UpdateClientDto } from '@/clients/dto/update-client.dto';
import { ClientNotFoundException } from '@/clients/exceptions/client-not-found.exception';
import { ClientAlreadyExistsException } from '@/clients/exceptions/client-already-exists.exception';
import { MailService } from '@/mail/mail.service';

export const EMAIL_VERIFICATION_TTL_HOURS = 24;

@Injectable()
export class ClientsService implements ClientsServiceInterface {
  constructor(
    @InjectRepository(Client)
    private readonly clientRepository: Repository<Client>,
    @InjectRepository(ClientRefreshToken)
    private readonly clientRefreshTokenRepository: Repository<ClientRefreshToken>,
    private readonly mailService: MailService,
  ) {}

  public async findAll(
    paginationParams: PaginationParamsDto,
  ): Promise<PaginatedResultDto<Client>> {
    const { page, limit, query } = paginationParams;
    const skip = (page - 1) * limit;

    const qb = this.clientRepository
      .createQueryBuilder('client')
      .orderBy('client.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    if (query) {
      qb.andWhere(
        `(
          client.firstName LIKE :query OR
          client.lastName LIKE :query OR
          client.email LIKE :query OR
          client.phone LIKE :query
        )`,
        { query: `%${query}%` },
      );
    }

    const [clients, total] = await qb.getManyAndCount();

    return createPaginatedResponse(clients, total, paginationParams);
  }

  public async find(uuid: string): Promise<ResponseDto> {
    const client = await this.clientRepository.findOneBy({ uuid });

    if (!client) throw new ClientNotFoundException();

    return ResponseHelper.success('Client found', HttpStatus.OK, client);
  }

  public async create(createClientDto: CreateClientDto): Promise<ResponseDto> {
    const existing = await this.clientRepository.findOneBy({
      email: createClientDto.email,
    });

    if (existing) throw new ClientAlreadyExistsException();

    const hashedPassword = await bcrypt.hash(createClientDto.password, 10);
    const emailVerificationToken = crypto.randomUUID();
    const emailVerificationDate = new Date();

    const client = await this.clientRepository.save({
      email: createClientDto.email,
      password: hashedPassword,
      firstName: createClientDto.firstName,
      lastName: createClientDto.lastName,
      phone: createClientDto.phone,
      notes: createClientDto.notes,
      marketingConsent: createClientDto.marketingConsent ?? false,
      emailVerificationToken,
      emailVerificationDate,
      emailVerified: false,
    });

    await this.mailService.sendClientEmailVerification(
      client.email,
      emailVerificationToken,
    );

    const { password, emailVerificationToken: token, ...result } = client;

    return ResponseHelper.created(
      'Konto zostało utworzone. Sprawdź email aby aktywować konto.',
      result,
    );
  }

  public async update(
    uuid: string,
    updateClientDto: UpdateClientDto,
  ): Promise<ResponseDto> {
    const client = await this.clientRepository.findOneBy({ uuid });

    if (!client) throw new ClientNotFoundException();

    if (updateClientDto.firstName !== undefined) {
      client.firstName = updateClientDto.firstName;
    }

    if (updateClientDto.lastName !== undefined) {
      client.lastName = updateClientDto.lastName;
    }

    if (updateClientDto.phone !== undefined) {
      client.phone = updateClientDto.phone;
    }

    if (updateClientDto.notes !== undefined) {
      client.notes = updateClientDto.notes;
    }

    if (updateClientDto.marketingConsent !== undefined) {
      client.marketingConsent = updateClientDto.marketingConsent;
    }

    if (updateClientDto.password) {
      client.password = await bcrypt.hash(updateClientDto.password, 10);
    }

    await this.clientRepository.save(client);

    return ResponseHelper.updated(
      'Dane klienta zostały zaktualizowane',
      client.uuid,
    );
  }

  public async remove(uuid: string): Promise<ResponseDto> {
    const client = await this.clientRepository.findOneBy({ uuid });

    if (!client) throw new ClientNotFoundException();

    await this.clientRefreshTokenRepository.delete({ client: { uuid } });
    await this.clientRepository.softDelete({ uuid });

    return ResponseHelper.deleted('Klient został usunięty');
  }

  public async verifyEmail(token: string): Promise<ResponseDto> {
    const client = await this.clientRepository.findOneBy({
      emailVerificationToken: token,
    });

    if (!client)
      throw new ClientNotFoundException('Nieprawidłowy token weryfikacji');

    const ttlMs = EMAIL_VERIFICATION_TTL_HOURS * 60 * 60 * 1000;
    const isExpired =
      new Date().getTime() - new Date(client.emailVerificationDate).getTime() >
      ttlMs;

    if (isExpired) {
      return ResponseHelper.success(
        'Token weryfikacji wygasł. Zarejestruj się ponownie.',
        HttpStatus.BAD_REQUEST,
      );
    }

    client.emailVerified = true;
    client.emailVerificationToken = null;
    client.emailVerificationDate = null;
    client.active = true;

    await this.clientRepository.save(client);

    return ResponseHelper.success(
      'Email został zweryfikowany. Możesz się teraz zalogować.',
    );
  }

  public async findByEmail(email: string): Promise<Client | null> {
    return this.clientRepository
      .createQueryBuilder('client')
      .addSelect('client.password')
      .where('client.email = :email', { email })
      .getOne();
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
