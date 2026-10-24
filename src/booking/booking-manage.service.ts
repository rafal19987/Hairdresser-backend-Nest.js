import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { ResponseDto } from '@/common/dto/response.dto';
import { ResponseHelper } from '@/common/helpers/response.helper';
import { BookingManageServiceInterface } from '@/booking/interfaces/booking-manage-service.interface';
import {
  ManagedAppointment,
  ManagedAppointmentsResponse,
} from '@/booking/interfaces/managed-appointments-response.interface';
import {
  CancelManagedAppointmentDto,
  RescheduleManagedAppointmentDto,
} from '@/booking/dto/manage-booking.dto';
import { BookingChangeDeadlinePassedException } from '@/booking/exceptions/booking-change-deadline-passed.exception';
import { Appointment } from '@/appointment/entities/appointment.entity';
import { AppointmentType } from '@/appointment/enums/appointment-type.enum';
import { AppointmentStatus } from '@/appointment/enums/appointment-status.enum';
import { CancelledBy } from '@/appointment/enums/appointment-cancelled-by.enum';
import { RescheduledBy } from '@/appointment/enums/appointment-rescheduled-by.enum';
import { AppointmentNotFoundException } from '@/appointment/exceptions/appointment-not-found.exception';
import { AppointmentNotModifiableException } from '@/appointment/exceptions/appointment-not-modifiable.exception';
import { UNFINISHED_APPOINTMENT_STATUSES } from '@/appointment/helpers/upcoming-client-appointments.helper';
import {
  APPOINTMENTS_SERVICE,
  AppointmentsServiceInterface,
} from '@/appointment/interfaces/appointments-service.interface';
import { Salon } from '@/salon/entities/salon.entity';
import {
  SALON_SERVICE,
  SalonServiceInterface,
} from '@/salon/interfaces/salon-service.interface';
import { BookingAccessService } from '@/booking-access/booking-access.service';
import { MailService } from '@/mail/mail.service';

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const HISTORY_LIMIT = 100;

@Injectable()
export class BookingManageService implements BookingManageServiceInterface {
  private readonly logger = new Logger(BookingManageService.name);

  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,
    @Inject(APPOINTMENTS_SERVICE)
    private readonly appointmentsService: AppointmentsServiceInterface,
    @Inject(SALON_SERVICE)
    private readonly salonService: SalonServiceInterface,
    private readonly bookingAccessService: BookingAccessService,
    private readonly mailService: MailService,
  ) {}

  public async findAppointments(email: string): Promise<ResponseDto> {
    const [salon, appointments] = await Promise.all([
      this.salonService.getBookingSettings(),
      this._appointmentsQuery(email)
        .orderBy('appointment.scheduledAt', 'DESC')
        .take(HISTORY_LIMIT)
        .getMany(),
    ]);

    const now = Date.now();
    const response: ManagedAppointmentsResponse = {
      email,
      upcoming: [],
      past: [],
    };

    for (const appointment of appointments) {
      const isUpcoming =
        appointment.scheduledEndAt.getTime() > now &&
        appointment.status !== AppointmentStatus.CANCELLED;

      (isUpcoming ? response.upcoming : response.past).push(
        this._toManagedAppointment(salon, appointment),
      );
    }

    response.upcoming.reverse();

    return ResponseHelper.success(
      'Appointments found',
      HttpStatus.OK,
      response,
    );
  }

  public async cancelAppointment(
    email: string,
    uuid: string,
    dto: CancelManagedAppointmentDto,
  ): Promise<ResponseDto> {
    await this._findChangeable(email, uuid);

    await this.appointmentsService.cancel(uuid, {
      cancelledBy: CancelledBy.CLIENT,
      cancellationReason: dto.reason,
    });

    return ResponseHelper.updated('Wizyta została anulowana', {
      uuid,
      status: AppointmentStatus.CANCELLED,
    });
  }

  public async rescheduleAppointment(
    email: string,
    uuid: string,
    dto: RescheduleManagedAppointmentDto,
  ): Promise<ResponseDto> {
    const appointment = await this._findChangeable(email, uuid);

    const startsAt = new Date(dto.startsAt);
    const endsAt = new Date(
      startsAt.getTime() + appointment.duration * MINUTE_MS,
    );

    await this.appointmentsService.reschedule(
      uuid,
      {
        scheduledAt: startsAt.toISOString(),
        scheduledEndAt: endsAt.toISOString(),
        rescheduledBy: RescheduledBy.CLIENT,
      },
      { bookedByClient: true },
    );

    return ResponseHelper.updated('Wizyta została przełożona', {
      uuid,
      status: AppointmentStatus.RESCHEDULED,
      startsAt: startsAt.toISOString(),
      endsAt: endsAt.toISOString(),
    });
  }

  // Same response whether or not the email has appointments, so it cannot be used to probe clients
  public async sendManageLink(email: string): Promise<ResponseDto> {
    const normalizedEmail = email.trim().toLowerCase();
    const hasAppointments =
      await this._appointmentsQuery(normalizedEmail).getExists();

    if (hasAppointments) {
      try {
        const manageUrl =
          await this.bookingAccessService.createManageUrl(normalizedEmail);
        if (manageUrl) {
          await this.mailService.sendBookingManageLink(
            normalizedEmail,
            manageUrl,
          );
        }
      } catch (error) {
        this.logger.error('Could not send booking manage link', error);
      }
    }

    return ResponseHelper.success(
      'Jeśli pod tym adresem są wizyty, wysłaliśmy na niego link',
      HttpStatus.OK,
    );
  }

  private _appointmentsQuery(email: string): SelectQueryBuilder<Appointment> {
    return this.appointmentRepository
      .createQueryBuilder('appointment')
      .leftJoin('appointment.client', 'client')
      .leftJoinAndSelect('appointment.userService', 'userService')
      .leftJoinAndSelect('userService.service', 'service')
      .leftJoinAndSelect('userService.user', 'employee')
      .where('appointment.type = :type', { type: AppointmentType.CLIENT })
      .andWhere('appointment.deleted = false')
      .andWhere(
        '(LOWER(appointment.clientEmail) = :email OR LOWER(client.email) = :email)',
        { email },
      );
  }

  private async _findChangeable(
    email: string,
    uuid: string,
  ): Promise<Appointment> {
    const [salon, appointment] = await Promise.all([
      this.salonService.getBookingSettings(),
      this._appointmentsQuery(email)
        .andWhere('appointment.uuid = :uuid', { uuid })
        .getOne(),
    ]);

    if (!appointment) throw new AppointmentNotFoundException();

    if (!UNFINISHED_APPOINTMENT_STATUSES.includes(appointment.status)) {
      throw new AppointmentNotModifiableException(
        'Tej wizyty nie można już zmienić',
      );
    }

    if (this._changeableUntil(salon, appointment) < Date.now()) {
      throw new BookingChangeDeadlinePassedException(
        salon.clientCancellationDeadlineHours,
      );
    }

    return appointment;
  }

  private _changeableUntil(salon: Salon, appointment: Appointment): number {
    return (
      appointment.scheduledAt.getTime() -
      salon.clientCancellationDeadlineHours * HOUR_MS
    );
  }

  private _toManagedAppointment(
    salon: Salon,
    appointment: Appointment,
  ): ManagedAppointment {
    const { userService } = appointment;
    const changeableUntil = this._changeableUntil(salon, appointment);
    const isChangeable =
      UNFINISHED_APPOINTMENT_STATUSES.includes(appointment.status) &&
      changeableUntil >= Date.now();

    return {
      uuid: appointment.uuid,
      status: appointment.status,
      startsAt: appointment.scheduledAt.toISOString(),
      endsAt: appointment.scheduledEndAt.toISOString(),
      serviceId: userService?.service?.uuid ?? null,
      serviceName: userService?.service?.name ?? appointment.name,
      employeeId: userService?.user?.uuid ?? null,
      employeeName: userService?.user
        ? [userService.user.firstName, userService.user.lastName]
            .filter(Boolean)
            .join(' ') || null
        : null,
      price: appointment.price,
      duration: appointment.duration,
      changeableUntil: isChangeable
        ? new Date(changeableUntil).toISOString()
        : null,
    };
  }
}
