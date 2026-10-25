import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ResponseDto } from '@/common/dto/response.dto';
import { ResponseHelper } from '@/common/helpers/response.helper';
import { Client } from '@/clients/entities/client.entity';
import { BookingAccountServiceInterface } from '@/booking/interfaces/booking-account-service.interface';
import {
  BOOKING_MANAGE_SERVICE,
  BookingManageServiceInterface,
} from '@/booking/interfaces/booking-manage-service.interface';
import {
  CancelManagedAppointmentDto,
  RescheduleManagedAppointmentDto,
} from '@/booking/dto/manage-booking.dto';
import { UpdateClientProfileDto } from '@/booking/dto/update-client-profile.dto';
import { BookingClientAccountUnavailableException } from '@/booking/exceptions/booking-client-account-unavailable.exception';

const toProfile = (client: Client) => ({
  uuid: client.uuid,
  email: client.email,
  firstName: client.firstName,
  lastName: client.lastName,
  phone: client.phone,
  marketingConsent: client.marketingConsent,
});

// Appointments are matched by the account email, so the account sees the same list as the emailed link
@Injectable()
export class BookingAccountService implements BookingAccountServiceInterface {
  constructor(
    @InjectRepository(Client)
    private readonly clientRepository: Repository<Client>,
    @Inject(BOOKING_MANAGE_SERVICE)
    private readonly bookingManageService: BookingManageServiceInterface,
  ) {}

  public async getProfile(clientId: string): Promise<ResponseDto> {
    const client = await this._findActiveClient(clientId);

    return ResponseHelper.success(
      'Client profile found',
      HttpStatus.OK,
      toProfile(client),
    );
  }

  public async updateProfile(
    clientId: string,
    dto: UpdateClientProfileDto,
  ): Promise<ResponseDto> {
    const client = await this._findActiveClient(clientId);

    const changes = Object.fromEntries(
      Object.entries(dto).filter(([, value]) => value !== undefined),
    );
    const saved = await this.clientRepository.save({ ...client, ...changes });

    return ResponseHelper.updated(
      'Dane zostały zaktualizowane',
      toProfile(saved),
    );
  }

  public async findAppointments(clientId: string): Promise<ResponseDto> {
    const client = await this._findActiveClient(clientId);

    return this.bookingManageService.findAppointments(client.email);
  }

  public async cancelAppointment(
    clientId: string,
    uuid: string,
    dto: CancelManagedAppointmentDto,
  ): Promise<ResponseDto> {
    const client = await this._findActiveClient(clientId);

    return this.bookingManageService.cancelAppointment(client.email, uuid, dto);
  }

  public async rescheduleAppointment(
    clientId: string,
    uuid: string,
    dto: RescheduleManagedAppointmentDto,
  ): Promise<ResponseDto> {
    const client = await this._findActiveClient(clientId);

    return this.bookingManageService.rescheduleAppointment(
      client.email,
      uuid,
      dto,
    );
  }

  public async findRescheduleSlots(
    clientId: string,
    uuid: string,
    date: string,
  ): Promise<ResponseDto> {
    const client = await this._findActiveClient(clientId);

    return this.bookingManageService.findRescheduleSlots(
      client.email,
      uuid,
      date,
    );
  }

  private async _findActiveClient(clientId: string): Promise<Client> {
    const client = await this.clientRepository.findOneBy({
      uuid: clientId,
      active: true,
      emailVerified: true,
    });

    if (!client) throw new BookingClientAccountUnavailableException();

    return client;
  }
}
