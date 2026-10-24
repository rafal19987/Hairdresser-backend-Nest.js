import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appointment } from './entities/appointment.entity';
import { Calendar } from '@/calendar/entities/calendar.entity';
import { User } from '@/users/entities/user.entity';
import { Client } from '@/clients/entities/client.entity';
import { UsersServices } from '@/users-services/entities/users-services.entity';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { CreateInternalAppointmentDto } from './dto/create-internal-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { CancelAppointmentDto } from './dto/cancel-appointment.dto';
import { RescheduleAppointmentDto } from './dto/reschedule-appointment.dto';
import { ResponseDto } from '@/common/dto/response.dto';
import { ResponseHelper } from '@/common/helpers/response.helper';
import { PaginationParamsDto } from '@/common/dto/pagination-params.dto';
import { PaginatedResultDto } from '@/common/dto/paginated-result.dto';
import { createPaginatedResponse } from '@/common/helpers/pagination.helper';
import {
  AppointmentsServiceInterface,
  CreateAppointmentOptions,
} from '@/appointment/interfaces/appointments-service.interface';
import { AppointmentNotFoundException } from '@/appointment/exceptions/appointment-not-found.exception';
import { AppointmentAlreadyCancelledException } from '@/appointment/exceptions/appointment-already-cancelled.exception';
import { AppointmentConflictException } from '@/appointment/exceptions/appointment-conflict.exception';
import { AppointmentNotModifiableException } from '@/appointment/exceptions/appointment-not-modifiable.exception';
import { AppointmentInvalidDateRangeException } from '@/appointment/exceptions/appointment-invalid-date-range.exception';
import { AppointmentResponse } from '@/appointment/interfaces/appointment-response.interface';
import { toAppointmentResponse } from '@/appointment/mappers/appointment-response.mapper';
import { AppointmentInPastException } from '@/appointment/exceptions/appointment-in-past.exception';
import { AppointmentLeadTimeException } from '@/appointment/exceptions/appointment-lead-time.exception';
import { AppointmentClientEmailRequiredException } from '@/appointment/exceptions/appointment-client-email-required.exception';
import { AppointmentUnavailableException } from '@/appointment/exceptions/appointment-unavailable.exception';
import { AppointmentDurationMismatchException } from '@/appointment/exceptions/appointment-duration-mismatch.exception';
import { AppointmentRelationMismatchException } from '@/appointment/exceptions/appointment-relation-mismatch.exception';
import { CLIENT_BOOKING_MIN_LEAD_TIME_MINUTES } from '@/appointment/constants';
import { ClientNotFoundException } from '@/clients/exceptions/client-not-found.exception';
import { UserServiceNotFoundException } from '@/users-services/exceptions/users-services-not-found.exception';
import { CalendarNotFoundException } from '@/calendar/exceptions/calendar-not-found.exception';
import { UserNotFoundException } from '@/users/exceptions/user-not-found.exception';
import { AppointmentStatus } from '@/appointment/enums/appointment-status.enum';
import { MailService } from '@/mail/mail.service';
import {
  AppointmentMailData,
  AppointmentCancelledMailData,
  AppointmentRescheduledMailData,
} from '@/mail/interfaces/mail.interface';

@Injectable()
export class AppointmentsService implements AppointmentsServiceInterface {
  private readonly logger = new Logger(AppointmentsService.name);

  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,
    @InjectRepository(Calendar)
    private readonly calendarRepository: Repository<Calendar>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Client)
    private readonly clientRepository: Repository<Client>,
    @InjectRepository(UsersServices)
    private readonly usersServicesRepository: Repository<UsersServices>,
    private readonly mailService: MailService,
  ) {}

  public async findAll(
    paginationParams: PaginationParamsDto,
  ): Promise<PaginatedResultDto<AppointmentResponse>> {
    const { page, limit, query } = paginationParams;
    const skip = (page - 1) * limit;

    const qb = this.appointmentRepository
      .createQueryBuilder('appointment')
      .leftJoinAndSelect('appointment.calendar', 'calendar')
      .leftJoinAndSelect('appointment.client', 'client')
      .leftJoinAndSelect('appointment.userService', 'userService')
      .leftJoinAndSelect('userService.user', 'employee')
      .leftJoinAndSelect('userService.service', 'service')
      .leftJoinAndSelect('appointment.createdBy', 'createdBy')
      .where('appointment.deleted = false')
      .orderBy('appointment.scheduledAt', 'DESC')
      .skip(skip)
      .take(limit);

    if (query) {
      qb.andWhere(
        `(
          appointment.name LIKE :query OR
          client.firstName LIKE :query OR
          client.lastName LIKE :query OR
          client.email LIKE :query OR
          appointment.clientEmail LIKE :query OR
          employee.firstName LIKE :query OR
          employee.lastName LIKE :query OR
          service.name LIKE :query
        )`,
        { query: `%${query}%` },
      );
    }

    const [appointments, total] = await qb.getManyAndCount();

    return createPaginatedResponse(
      appointments.map(toAppointmentResponse),
      total,
      paginationParams,
    );
  }

  public async findByCalendar(
    calendarUuid: string,
    paginationParams: PaginationParamsDto,
  ): Promise<PaginatedResultDto<AppointmentResponse>> {
    const { page, limit } = paginationParams;
    const skip = (page - 1) * limit;

    const [appointments, total] = await this.appointmentRepository.findAndCount(
      {
        where: { calendar: { uuid: calendarUuid }, deleted: false },
        relations: [
          'client',
          'userService',
          'userService.user',
          'userService.service',
        ],
        order: { scheduledAt: 'ASC' },
        skip,
        take: limit,
      },
    );

    return createPaginatedResponse(
      appointments.map(toAppointmentResponse),
      total,
      paginationParams,
    );
  }

  public async find(uuid: string): Promise<ResponseDto> {
    const appointment = await this._findNotDeleted(uuid, [
      'calendar',
      'client',
      'userService',
      'userService.user',
      'userService.service',
      'createdBy',
    ]);

    return ResponseHelper.success(
      'Appointment found',
      HttpStatus.OK,
      toAppointmentResponse(appointment),
    );
  }

  public async create(
    createAppointmentDto: CreateAppointmentDto,
    options: CreateAppointmentOptions = {},
  ): Promise<ResponseDto> {
    const scheduledAt = new Date(createAppointmentDto.scheduledAt);

    this._assertSchedulable(scheduledAt, options.bookedByClient);

    const userService = await this.usersServicesRepository.findOne({
      where: { uuid: createAppointmentDto.userServiceId },
      relations: ['user', 'service'],
    });

    if (!userService) {
      throw new UserNotFoundException(
        'Usługa pracownika nie została znaleziona',
      );
    }

    this._assertUserServiceAvailable(userService);

    const calendar = await this.calendarRepository.findOneBy({
      owner: { uuid: userService.user.uuid },
      isDefault: true,
      active: true,
      deleted: false,
    });

    if (!calendar) {
      throw new CalendarNotFoundException(
        'Pracownik nie ma ustawionego domyślnego kalendarza',
      );
    }

    const client = await this._findClient(options.clientUuid);

    const clientEmail =
      client?.email ?? createAppointmentDto.clientEmail ?? null;

    if (!clientEmail) throw new AppointmentClientEmailRequiredException();

    const scheduledEndAt = new Date(
      scheduledAt.getTime() + userService.duration * 60 * 1000,
    );

    await this._checkConflict(calendar.uuid, scheduledAt, scheduledEndAt);

    const clientPhone =
      client?.phone ?? createAppointmentDto.clientPhone ?? null;
    const clientName = client
      ? `${client.firstName} ${client.lastName}`
      : (clientEmail ?? 'Klient');

    const name = `${userService.service.name} — ${userService.user.firstName} ${userService.user.lastName}`;

    const appointment = this.appointmentRepository.create({
      name,
      calendar,
      client,
      userService,
      price: userService.price,
      duration: userService.duration,
      status: AppointmentStatus.PENDING,
      note: createAppointmentDto.note,
      clientEmail,
      clientPhone,
      scheduledAt,
      scheduledEndAt,
      createdBy: userService.user,
    });

    await this.appointmentRepository.save(appointment);

    const mailData: AppointmentMailData = {
      clientName,
      employeeName: `${userService.user.firstName} ${userService.user.lastName}`,
      serviceName: userService.service.name,
      scheduledAt,
      scheduledEndAt,
      price: userService.price,
      note: createAppointmentDto.note,
    };

    this._sendMailSafe(() =>
      this.mailService.sendAppointmentCreatedToClient(clientEmail, mailData),
    );

    this._sendMailSafe(() =>
      this.mailService.sendAppointmentCreatedToEmployee(
        userService.user.email,
        mailData,
      ),
    );

    return ResponseHelper.created('Wizyta została utworzona', {
      uuid: appointment.uuid,
    });
  }

  public async createInternal(
    dto: CreateInternalAppointmentDto,
  ): Promise<ResponseDto> {
    const scheduledAt = new Date(dto.scheduledAt);
    const scheduledEndAt = new Date(dto.scheduledEndAt);

    this._assertSchedulable(scheduledAt);

    const duration = this._getDurationInMinutes(scheduledAt, scheduledEndAt);

    if (dto.duration !== undefined && dto.duration !== duration) {
      throw new AppointmentDurationMismatchException();
    }

    const owner = await this.userRepository.findOneBy({ uuid: dto.ownerId });
    if (!owner)
      throw new UserNotFoundException('Pracownik nie został znaleziony');

    const calendar = await this.calendarRepository.findOne({
      where: { uuid: dto.calendarId, active: true, deleted: false },
      relations: ['owner'],
    });
    if (!calendar)
      throw new CalendarNotFoundException('Kalendarz nie został znaleziony');

    if (calendar.owner?.uuid !== owner.uuid) {
      throw new AppointmentRelationMismatchException(
        'Kalendarz nie należy do wskazanego pracownika',
      );
    }

    const client = await this._findClient(dto.clientId);

    let userService: UsersServices | null = null;

    if (dto.userServiceId) {
      userService = await this.usersServicesRepository.findOne({
        where: { uuid: dto.userServiceId },
        relations: ['user', 'service'],
      });

      if (!userService) throw new UserServiceNotFoundException();

      if (userService.user?.uuid !== owner.uuid) {
        throw new AppointmentRelationMismatchException(
          'Usługa nie jest przypisana do wskazanego pracownika',
        );
      }
    }

    await this._checkConflict(calendar.uuid, scheduledAt, scheduledEndAt);

    const appointment = this.appointmentRepository.create({
      name: dto.name,
      calendar,
      client,
      userService,
      price: userService?.price ?? null,
      duration,
      status: AppointmentStatus.CONFIRMED,
      note: dto.note,
      meetingLink: dto.meetingLink,
      eventLocalization: dto.eventLocalization,
      scheduledAt,
      scheduledEndAt,
      createdBy: owner,
    });

    await this.appointmentRepository.save(appointment);

    return ResponseHelper.created('Wizyta została utworzona', {
      uuid: appointment.uuid,
    });
  }

  public async update(
    uuid: string,
    dto: UpdateAppointmentDto,
  ): Promise<ResponseDto> {
    const appointment = await this._findNotDeleted(uuid, ['calendar']);

    this._assertNotCancelled(appointment);

    const previousStatus = appointment.status;

    if (dto.scheduledAt || dto.scheduledEndAt || dto.duration !== undefined) {
      this._assertNotCompleted(
        appointment,
        'Zakończonej wizyty nie można przełożyć',
      );

      const scheduledAt = dto.scheduledAt
        ? new Date(dto.scheduledAt)
        : appointment.scheduledAt;

      if (dto.scheduledAt) this._assertSchedulable(scheduledAt);

      let scheduledEndAt = appointment.scheduledEndAt;

      if (dto.scheduledEndAt) {
        scheduledEndAt = new Date(dto.scheduledEndAt);
      } else if (dto.duration !== undefined) {
        scheduledEndAt = new Date(
          scheduledAt.getTime() + dto.duration * 60 * 1000,
        );
      }

      if (scheduledEndAt <= scheduledAt) {
        throw new AppointmentInvalidDateRangeException();
      }

      const duration = this._getDurationInMinutes(scheduledAt, scheduledEndAt);

      if (dto.duration !== undefined && dto.duration !== duration) {
        throw new AppointmentDurationMismatchException();
      }

      await this._checkConflict(
        appointment.calendar.uuid,
        scheduledAt,
        scheduledEndAt,
        uuid,
      );

      appointment.scheduledAt = scheduledAt;
      appointment.scheduledEndAt = scheduledEndAt;
      appointment.duration = duration;
    }

    if (dto.name) appointment.name = dto.name;
    if (dto.status) appointment.status = dto.status;
    if (dto.note !== undefined) appointment.note = dto.note;
    if (dto.meetingLink !== undefined)
      appointment.meetingLink = dto.meetingLink;
    if (dto.eventLocalization !== undefined)
      appointment.eventLocalization = dto.eventLocalization;

    await this.appointmentRepository.save(appointment);

    if (
      dto.status === AppointmentStatus.CONFIRMED &&
      previousStatus !== AppointmentStatus.CONFIRMED
    ) {
      await this._sendConfirmedMail(appointment);
    }

    return ResponseHelper.updated('Wizyta została zaktualizowana', uuid);
  }

  public async cancel(
    uuid: string,
    dto: CancelAppointmentDto,
  ): Promise<ResponseDto> {
    const appointment = await this._findNotDeleted(uuid, [
      'client',
      'userService',
      'userService.user',
      'userService.service',
    ]);

    if (appointment.status === AppointmentStatus.CANCELLED) {
      throw new AppointmentAlreadyCancelledException();
    }

    this._assertNotCompleted(
      appointment,
      'Zakończonej wizyty nie można anulować',
    );

    appointment.status = AppointmentStatus.CANCELLED;
    appointment.cancelledBy = dto.cancelledBy;
    appointment.cancelledAt = new Date();
    appointment.cancellationReason = dto.cancellationReason ?? null;

    await this.appointmentRepository.save(appointment);

    const mailData: AppointmentCancelledMailData = {
      clientName: this._getClientName(appointment),
      employeeName: this._getEmployeeName(appointment),
      serviceName: appointment.userService?.service?.name ?? 'Wizyta',
      scheduledAt: appointment.scheduledAt,
      scheduledEndAt: appointment.scheduledEndAt,
      price: appointment.price,
      cancelledBy: dto.cancelledBy,
      cancellationReason: dto.cancellationReason,
    };

    const clientEmail = appointment.client?.email ?? appointment.clientEmail;
    if (clientEmail) {
      this._sendMailSafe(() =>
        this.mailService.sendAppointmentCancelledToClient(
          clientEmail,
          mailData,
        ),
      );
    }

    if (appointment.userService?.user?.email) {
      this._sendMailSafe(() =>
        this.mailService.sendAppointmentCancelledToEmployee(
          appointment.userService.user.email,
          mailData,
        ),
      );
    }

    return ResponseHelper.updated('Wizyta została anulowana', uuid);
  }

  public async reschedule(
    uuid: string,
    dto: RescheduleAppointmentDto,
  ): Promise<ResponseDto> {
    const appointment = await this._findNotDeleted(uuid, [
      'calendar',
      'client',
      'userService',
      'userService.user',
      'userService.service',
    ]);

    this._assertNotCancelled(appointment);
    this._assertNotCompleted(
      appointment,
      'Zakończonej wizyty nie można przełożyć',
    );

    const scheduledAt = new Date(dto.scheduledAt);
    const scheduledEndAt = new Date(dto.scheduledEndAt);

    this._assertSchedulable(scheduledAt);

    await this._checkConflict(
      appointment.calendar.uuid,
      scheduledAt,
      scheduledEndAt,
      uuid,
    );

    const previousScheduledAt = appointment.scheduledAt;
    const previousScheduledEndAt = appointment.scheduledEndAt;

    appointment.previousScheduledAt = previousScheduledAt;
    appointment.previousScheduledEndAt = previousScheduledEndAt;
    appointment.scheduledAt = scheduledAt;
    appointment.scheduledEndAt = scheduledEndAt;
    appointment.duration = this._getDurationInMinutes(
      scheduledAt,
      scheduledEndAt,
    );
    appointment.status = AppointmentStatus.RESCHEDULED;
    appointment.rescheduledBy = dto.rescheduledBy;
    appointment.rescheduledAt = new Date();

    if (dto.note !== undefined) appointment.note = dto.note;

    await this.appointmentRepository.save(appointment);

    const mailData: AppointmentRescheduledMailData = {
      clientName: this._getClientName(appointment),
      employeeName: this._getEmployeeName(appointment),
      serviceName: appointment.userService?.service?.name ?? 'Wizyta',
      scheduledAt,
      scheduledEndAt,
      price: appointment.price,
      previousScheduledAt,
      previousScheduledEndAt,
      rescheduledBy: dto.rescheduledBy,
    };

    const clientEmail = appointment.client?.email ?? appointment.clientEmail;
    if (clientEmail) {
      this._sendMailSafe(() =>
        this.mailService.sendAppointmentRescheduledToClient(
          clientEmail,
          mailData,
        ),
      );
    }

    if (appointment.userService?.user?.email) {
      this._sendMailSafe(() =>
        this.mailService.sendAppointmentRescheduledToEmployee(
          appointment.userService.user.email,
          mailData,
        ),
      );
    }

    return ResponseHelper.updated('Wizyta została przełożona', uuid);
  }

  public async remove(uuid: string): Promise<ResponseDto> {
    const appointment = await this._findNotDeleted(uuid);

    appointment.deleted = true;
    await this.appointmentRepository.save(appointment);

    return ResponseHelper.deleted('Wizyta została usunięta');
  }

  private async _findNotDeleted(
    uuid: string,
    relations: string[] = [],
  ): Promise<Appointment> {
    const appointment = await this.appointmentRepository.findOne({
      where: { uuid, deleted: false },
      relations,
    });

    if (!appointment) throw new AppointmentNotFoundException();

    return appointment;
  }

  private _assertNotCancelled(appointment: Appointment): void {
    if (appointment.status === AppointmentStatus.CANCELLED) {
      throw new AppointmentNotModifiableException(
        'Anulowanej wizyty nie można modyfikować',
      );
    }
  }

  private _assertNotCompleted(appointment: Appointment, message: string): void {
    if (appointment.status === AppointmentStatus.COMPLETED) {
      throw new AppointmentNotModifiableException(message);
    }
  }

  private _assertSchedulable(scheduledAt: Date, bookedByClient = false): void {
    const now = Date.now();

    if (scheduledAt.getTime() <= now) throw new AppointmentInPastException();

    const minLeadTimeMs = CLIENT_BOOKING_MIN_LEAD_TIME_MINUTES * 60 * 1000;

    if (bookedByClient && scheduledAt.getTime() < now + minLeadTimeMs) {
      throw new AppointmentLeadTimeException();
    }
  }

  private _assertUserServiceAvailable(userService: UsersServices): void {
    const { service, user } = userService;

    if (!userService.active || !service?.active || service.deleted) {
      throw new AppointmentUnavailableException();
    }

    if (!user?.active || user.deleted) {
      throw new AppointmentUnavailableException(
        'Wybrany pracownik jest niedostępny',
      );
    }
  }

  private async _findClient(uuid?: string): Promise<Client | null> {
    if (!uuid) return null;

    const client = await this.clientRepository.findOneBy({ uuid });

    if (!client) throw new ClientNotFoundException();

    return client;
  }

  private _getDurationInMinutes(
    scheduledAt: Date,
    scheduledEndAt: Date,
  ): number {
    return Math.round(
      (scheduledEndAt.getTime() - scheduledAt.getTime()) / 60000,
    );
  }

  private async _sendConfirmedMail(appointment: Appointment): Promise<void> {
    const fullAppointment = await this.appointmentRepository.findOne({
      where: { uuid: appointment.uuid },
      relations: [
        'client',
        'userService',
        'userService.user',
        'userService.service',
      ],
    });

    if (!fullAppointment) return;

    const mailData: AppointmentMailData = {
      clientName: this._getClientName(fullAppointment),
      employeeName: this._getEmployeeName(fullAppointment),
      serviceName: fullAppointment.userService?.service?.name ?? 'Wizyta',
      scheduledAt: fullAppointment.scheduledAt,
      scheduledEndAt: fullAppointment.scheduledEndAt,
      price: fullAppointment.price,
    };

    const clientEmail =
      fullAppointment.client?.email ?? fullAppointment.clientEmail;
    if (clientEmail) {
      this._sendMailSafe(() =>
        this.mailService.sendAppointmentConfirmedToClient(
          clientEmail,
          mailData,
        ),
      );
    }
  }

  private _getClientName(appointment: Appointment): string {
    if (appointment.client?.firstName) {
      return `${appointment.client.firstName} ${appointment.client.lastName}`;
    }
    return appointment.clientEmail ?? 'Klient';
  }

  private _getEmployeeName(appointment: Appointment): string {
    if (appointment.userService?.user) {
      return `${appointment.userService.user.firstName} ${appointment.userService.user.lastName}`;
    }
    return 'Pracownik';
  }

  private _sendMailSafe(fn: () => Promise<void>): void {
    fn().catch(error => {
      this.logger.error('Błąd wysyłania maila', error);
    });
  }

  private async _checkConflict(
    calendarUuid: string,
    scheduledAt: Date,
    scheduledEndAt: Date,
    excludeUuid?: string,
  ): Promise<void> {
    const qb = this.appointmentRepository
      .createQueryBuilder('appointment')
      .where('appointment.calendar = :calendarUuid', { calendarUuid })
      .andWhere('appointment.status != :cancelled', {
        cancelled: AppointmentStatus.CANCELLED,
      })
      .andWhere('appointment.deleted = false')
      .andWhere(
        '(appointment.scheduledAt < :scheduledEndAt AND appointment.scheduledEndAt > :scheduledAt)',
        { scheduledAt, scheduledEndAt },
      );

    if (excludeUuid) {
      qb.andWhere('appointment.uuid != :excludeUuid', { excludeUuid });
    }

    const conflict = await qb.getOne();

    if (conflict) throw new AppointmentConflictException();
  }
}
