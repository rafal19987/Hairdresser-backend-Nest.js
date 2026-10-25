import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';
import { ResponseDto } from '@/common/dto/response.dto';
import { ResponseHelper } from '@/common/helpers/response.helper';
import { PaginationParamsDto } from '@/common/dto/pagination-params.dto';
import { PaginatedResultDto } from '@/common/dto/paginated-result.dto';
import { createPaginatedResponse } from '@/common/helpers/pagination.helper';
import { Client } from '@/clients/entities/client.entity';
import { ClientsServiceInterface } from '@/clients/interfaces/clients-service.interface';
import { CreateClientDto } from '@/clients/dto/create-client.dto';
import { UpdateClientDto } from '@/clients/dto/update-client.dto';
import { ClientNotFoundException } from '@/clients/exceptions/client-not-found.exception';
import { ClientAlreadyExistsException } from '@/clients/exceptions/client-already-exists.exception';
import { ClientVerificationTokenExpiredException } from '@/clients/exceptions/client-verification-token-expired.exception';
import { MailService } from '@/mail/mail.service';
import { Appointment } from '@/appointment/entities/appointment.entity';
import { AppointmentType } from '@/appointment/enums/appointment-type.enum';
import { ClientRefreshToken } from '@/auth-client/entities/client-refresh-token.entity';
import { ClientPasswordResetTokenInvalidException } from '@/clients/exceptions/client-password-reset-token-invalid.exception';

export const EMAIL_VERIFICATION_TTL_HOURS = 24;
export const PASSWORD_RESET_TTL_MINUTES = 60;

const hashToken = (token: string): string =>
  createHash('sha256').update(token).digest('hex');

@Injectable()
export class ClientsService implements ClientsServiceInterface {
  private readonly logger = new Logger(ClientsService.name);

  constructor(
    @InjectRepository(Client)
    private readonly clientRepository: Repository<Client>,
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,
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
      marketingConsent: createClientDto.marketingConsent ?? false,
      emailVerificationToken,
      emailVerificationDate,
      emailVerified: false,
    });

    // The account already exists, so a mail failure must not fail the registration
    try {
      await this.mailService.sendClientEmailVerification(
        client.email,
        emailVerificationToken,
      );
    } catch (error) {
      this.logger.error(
        `Could not send verification email to ${client.email}`,
        error,
      );
    }

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

    if (isExpired) throw new ClientVerificationTokenExpiredException();

    client.emailVerified = true;
    client.emailVerificationToken = null;
    client.emailVerificationDate = null;
    client.active = true;

    await this.clientRepository.save(client);

    const linkedAppointments = await this._linkGuestAppointments(client);

    return ResponseHelper.success(
      'Email został zweryfikowany. Możesz się teraz zalogować.',
      HttpStatus.OK,
      { linkedAppointments },
    );
  }

  public async resendVerification(email: string): Promise<ResponseDto> {
    // Ta sama odpowiedź niezależnie od istnienia konta - brak enumeracji emaili
    const response = ResponseHelper.success(
      'Jeśli konto wymaga aktywacji, wysłaliśmy nowy link na podany email.',
    );

    const client = await this.clientRepository.findOneBy({ email });

    if (!client || client.emailVerified) return response;

    client.emailVerificationToken = crypto.randomUUID();
    client.emailVerificationDate = new Date();

    await this.clientRepository.save(client);

    await this.mailService.sendClientEmailVerification(
      client.email,
      client.emailVerificationToken,
    );

    return response;
  }

  // Same response whether or not the account exists, so it cannot be used to probe emails
  public async requestPasswordReset(email: string): Promise<ResponseDto> {
    const response = ResponseHelper.success(
      'Jeśli konto z tym adresem istnieje, wysłaliśmy na niego link do zmiany hasła.',
    );

    const client = await this.clientRepository.findOneBy({ email });

    if (!client || !client.active) return response;

    const token = randomBytes(32).toString('base64url');

    await this.clientRepository.update(client.uuid, {
      passwordResetTokenHash: hashToken(token),
      passwordResetExpiresAt: new Date(
        Date.now() + PASSWORD_RESET_TTL_MINUTES * 60 * 1000,
      ),
    });

    try {
      await this.mailService.sendClientPasswordReset(client.email, token);
    } catch (error) {
      this.logger.error(
        `Could not send password reset email to ${client.email}`,
        error,
      );
    }

    return response;
  }

  public async resetPassword(
    token: string,
    password: string,
  ): Promise<ResponseDto> {
    const client = await this.clientRepository.findOneBy({
      passwordResetTokenHash: hashToken(token),
      passwordResetExpiresAt: MoreThan(new Date(Date.now())),
      active: true,
    });

    if (!client) throw new ClientPasswordResetTokenInvalidException();

    // The link proves access to the mailbox, so it also verifies the email
    const verifiesEmail = !client.emailVerified;

    await this.clientRepository.update(client.uuid, {
      password: await bcrypt.hash(password, 10),
      passwordResetTokenHash: null,
      passwordResetExpiresAt: null,
      ...(verifiesEmail && {
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationDate: null,
      }),
    });

    // Sessions opened with the old password must not survive the reset
    await this.clientRefreshTokenRepository.delete({
      client: { uuid: client.uuid },
    });

    if (verifiesEmail) await this._linkGuestAppointments(client);

    return ResponseHelper.success(
      'Hasło zostało zmienione. Możesz się teraz zalogować.',
    );
  }

  public async findByEmail(email: string): Promise<Client | null> {
    return this.clientRepository
      .createQueryBuilder('client')
      .addSelect('client.password')
      .where('client.email = :email', { email })
      .getOne();
  }

  // Runs only after the email is verified, so nobody can claim someone else's bookings
  private async _linkGuestAppointments(client: Client): Promise<number> {
    const result = await this.appointmentRepository
      .createQueryBuilder()
      .update(Appointment)
      .set({ client: { uuid: client.uuid } })
      .where('client_id IS NULL')
      .andWhere('LOWER(clientEmail) = :email', {
        email: client.email.toLowerCase(),
      })
      .andWhere('type = :type', { type: AppointmentType.CLIENT })
      .execute();

    return result.affected ?? 0;
  }
}
