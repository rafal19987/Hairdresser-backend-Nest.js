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
import { AppointmentsServiceInterface } from '@/appointment/interfaces/appointments-service.interface';
import { AppointmentNotFoundException } from '@/appointment/exceptions/appointment-not-found.exception';
import { AppointmentAlreadyCancelledException } from '@/appointment/exceptions/appointment-already-cancelled.exception';
import { AppointmentConflictException } from '@/appointment/exceptions/appointment-conflict.exception';
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
  ): Promise<PaginatedResultDto<Appointment>> {
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

    return createPaginatedResponse(appointments, total, paginationParams);
  }

  public async findByCalendar(
    calendarUuid: string,
    paginationParams: PaginationParamsDto,
  ): Promise<PaginatedResultDto<Appointment>> {
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

    return createPaginatedResponse(appointments, total, paginationParams);
  }

  public async find(uuid: string): Promise<ResponseDto> {
    const appointment = await this.appointmentRepository.findOne({
      where: { uuid, deleted: false },
      relations: [
        'calendar',
        'client',
        'userService',
        'userService.user',
        'userService.service',
        'createdBy',
      ],
    });

    if (!appointment) throw new AppointmentNotFoundException();

    return ResponseHelper.success(
      'Appointment found',
      HttpStatus.OK,
      appointment,
    );
  }

  public async create(
    createAppointmentDto: CreateAppointmentDto,
    clientUuid?: string,
  ): Promise<ResponseDto> {
    const userService = await this.usersServicesRepository.findOne({
      where: { uuid: createAppointmentDto.userServiceId },
      relations: ['user', 'service'],
    });

    if (!userService) {
      throw new UserNotFoundException(
        'Usługa pracownika nie została znaleziona',
      );
    }

    const calendar = await this.calendarRepository.findOneBy({
      owner: { uuid: userService.user.uuid },
      isDefault: true,
      deleted: false,
    });

    if (!calendar) {
      throw new CalendarNotFoundException(
        'Pracownik nie ma ustawionego domyślnego kalendarza',
      );
    }

    const scheduledAt = new Date(createAppointmentDto.scheduledAt);
    const scheduledEndAt = new Date(
      scheduledAt.getTime() + userService.duration * 60 * 1000,
    );

    await this._checkConflict(calendar.uuid, scheduledAt, scheduledEndAt);

    let client: Client | null = null;
    if (clientUuid) {
      client = await this.clientRepository.findOneBy({ uuid: clientUuid });
    }

    const clientEmail =
      client?.email ?? createAppointmentDto.clientEmail ?? null;
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

    if (clientEmail) {
      this._sendMailSafe(() =>
        this.mailService.sendAppointmentCreatedToClient(clientEmail, mailData),
      );
    }

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
    const owner = await this.userRepository.findOneBy({ uuid: dto.ownerId });
    if (!owner)
      throw new UserNotFoundException('Pracownik nie został znaleziony');

    const calendar = await this.calendarRepository.findOneBy({
      uuid: dto.calendarId,
    });
    if (!calendar)
      throw new CalendarNotFoundException('Kalendarz nie został znaleziony');

    const scheduledAt = new Date(dto.scheduledAt);
    const scheduledEndAt = new Date(dto.scheduledEndAt);

    await this._checkConflict(calendar.uuid, scheduledAt, scheduledEndAt);

    let client: Client | null = null;
    if (dto.clientId) {
      client = await this.clientRepository.findOneBy({ uuid: dto.clientId });
    }

    let userService: UsersServices | null = null;
    let price: number | null = null;
    let duration: number | null = dto.duration ?? null;

    if (dto.userServiceId) {
      userService = await this.usersServicesRepository.findOne({
        where: { uuid: dto.userServiceId },
        relations: ['service'],
      });
      price = userService?.price ?? null;
      duration = duration ?? userService?.duration ?? null;
    }

    const appointment = this.appointmentRepository.create({
      name: dto.name,
      calendar,
      client,
      userService,
      price,
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
    const appointment = await this.appointmentRepository.findOne({
      where: { uuid },
      relations: ['calendar'],
    });

    if (!appointment) throw new AppointmentNotFoundException();

    if (dto.scheduledAt || dto.scheduledEndAt) {
      const scheduledAt = dto.scheduledAt
        ? new Date(dto.scheduledAt)
        : appointment.scheduledAt;

      const scheduledEndAt = dto.scheduledEndAt
        ? new Date(dto.scheduledEndAt)
        : appointment.scheduledEndAt;

      await this._checkConflict(
        appointment.calendar.uuid,
        scheduledAt,
        scheduledEndAt,
        uuid,
      );

      appointment.scheduledAt = scheduledAt;
      appointment.scheduledEndAt = scheduledEndAt;
    }

    if (dto.name) appointment.name = dto.name;
    if (dto.status) appointment.status = dto.status;
    if (dto.duration !== undefined) appointment.duration = dto.duration;
    if (dto.note !== undefined) appointment.note = dto.note;
    if (dto.meetingLink !== undefined)
      appointment.meetingLink = dto.meetingLink;
    if (dto.eventLocalization !== undefined)
      appointment.eventLocalization = dto.eventLocalization;

    await this.appointmentRepository.save(appointment);

    if (dto.status === AppointmentStatus.CONFIRMED) {
      await this._sendConfirmedMail(appointment);
    }

    return ResponseHelper.updated('Wizyta została zaktualizowana', uuid);
  }

  public async cancel(
    uuid: string,
    dto: CancelAppointmentDto,
  ): Promise<ResponseDto> {
    const appointment = await this.appointmentRepository.findOne({
      where: { uuid },
      relations: [
        'client',
        'userService',
        'userService.user',
        'userService.service',
      ],
    });

    if (!appointment) throw new AppointmentNotFoundException();

    if (appointment.status === AppointmentStatus.CANCELLED) {
      throw new AppointmentAlreadyCancelledException();
    }

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
    const appointment = await this.appointmentRepository.findOne({
      where: { uuid },
      relations: [
        'calendar',
        'client',
        'userService',
        'userService.user',
        'userService.service',
      ],
    });

    if (!appointment) throw new AppointmentNotFoundException();

    if (appointment.status === AppointmentStatus.CANCELLED) {
      throw new AppointmentAlreadyCancelledException();
    }

    const scheduledAt = new Date(dto.scheduledAt);
    const scheduledEndAt = new Date(dto.scheduledEndAt);

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
    const appointment = await this.appointmentRepository.findOneBy({ uuid });

    if (!appointment) throw new AppointmentNotFoundException();

    appointment.deleted = true;
    await this.appointmentRepository.save(appointment);

    return ResponseHelper.deleted('Wizyta została usunięta');
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
