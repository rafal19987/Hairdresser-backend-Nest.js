import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { ResponseDto } from '@/common/dto/response.dto';
import { ResponseHelper } from '@/common/helpers/response.helper';
import { BookingServiceInterface } from '@/booking/interfaces/booking-service.interface';
import { AvailableSlotsQueryDto } from '@/booking/dto/available-slots-query.dto';
import {
  AvailableSlot,
  AvailableSlotsResponse,
} from '@/booking/interfaces/available-slots-response.interface';
import {
  BookableEmployee,
  BookableEmployeesResponse,
} from '@/booking/interfaces/bookable-employees-response.interface';
import { BookableService } from '@/booking/interfaces/bookable-services-response.interface';
import { BookingEmployeeUnavailableException } from '@/booking/exceptions/booking-employee-unavailable.exception';
import { BookingGuestDetailsRequiredException } from '@/booking/exceptions/booking-guest-details-required.exception';
import { BookingClientAccountUnavailableException } from '@/booking/exceptions/booking-client-account-unavailable.exception';
import { CreateClientBookingDto } from '@/booking/dto/create-client-booking.dto';
import {
  APPOINTMENTS_SERVICE,
  AppointmentsServiceInterface,
} from '@/appointment/interfaces/appointments-service.interface';
import { Client } from '@/clients/entities/client.entity';
import { Appointment } from '@/appointment/entities/appointment.entity';
import { AppointmentType } from '@/appointment/enums/appointment-type.enum';
import { AppointmentStatus } from '@/appointment/enums/appointment-status.enum';
import { Calendar } from '@/calendar/entities/calendar.entity';
import { Service } from '@/services/entities/service.entity';
import { ServiceNotFoundException } from '@/services/exceptions/service-not-found.exception';
import { UsersServices } from '@/users-services/entities/users-services.entity';
import { Salon } from '@/salon/entities/salon.entity';
import {
  SALON_SERVICE,
  SalonServiceInterface,
} from '@/salon/interfaces/salon-service.interface';
import {
  addDays,
  formatLocalDate,
  fromLocalDateTime,
  TimeRange,
  toMinutes,
  toTime,
} from '@/salon/helpers/time.helper';

const MINUTE_MS = 60 * 1000;
const DAY_MS = 24 * 60 * MINUTE_MS;

interface BookableOffer {
  userServiceId: string;
  employeeId: string;
  duration: number;
}

interface BusyPeriod {
  startsAt: number;
  endsAt: number;
}

@Injectable()
export class BookingService implements BookingServiceInterface {
  constructor(
    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,
    @InjectRepository(UsersServices)
    private readonly usersServicesRepository: Repository<UsersServices>,
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,
    @InjectRepository(Client)
    private readonly clientRepository: Repository<Client>,
    @Inject(SALON_SERVICE)
    private readonly salonService: SalonServiceInterface,
    @Inject(APPOINTMENTS_SERVICE)
    private readonly appointmentsService: AppointmentsServiceInterface,
  ) {}

  public async createAppointment(
    dto: CreateClientBookingDto,
    clientId?: string,
  ): Promise<ResponseDto> {
    if (clientId) {
      const clientExists = await this.clientRepository.exists({
        where: { uuid: clientId, active: true, emailVerified: true },
      });

      if (!clientExists) throw new BookingClientAccountUnavailableException();
    } else if (!dto.firstName || !dto.email) {
      throw new BookingGuestDetailsRequiredException();
    }

    const clientName = [dto.firstName, dto.lastName].filter(Boolean).join(' ');

    const { data } = await this.appointmentsService.create(
      {
        userServiceId: dto.userServiceId,
        scheduledAt: dto.startsAt,
        clientName: clientName || undefined,
        clientEmail: dto.email,
        clientPhone: dto.phone,
        note: dto.note,
      },
      { clientUuid: clientId, bookedByClient: true },
    );

    return ResponseHelper.created('Rezerwacja została przyjęta', {
      uuid: data.uuid,
      status: data.status,
    });
  }

  public async findAvailableSlots(
    { serviceId, date, employeeId }: AvailableSlotsQueryDto,
    excludeAppointmentId?: string,
  ): Promise<ResponseDto> {
    const salon = await this.salonService.getBookingSettings();
    const response: AvailableSlotsResponse = { date, slots: [] };

    const [offers, openingRanges] = await Promise.all([
      this._findBookableOffers(serviceId, employeeId),
      this.salonService.findOpeningRanges(salon, date),
    ]);

    if (offers.length === 0) {
      await this._assertServiceBookable(serviceId, employeeId);
    } else if (
      openingRanges.length > 0 &&
      date >= formatLocalDate(new Date(Date.now()), salon.timeZone)
    ) {
      const busyPeriods = await this._findBusyPeriods(
        salon,
        date,
        offers,
        excludeAppointmentId,
      );
      response.slots = this._buildSlots(
        salon,
        date,
        openingRanges,
        offers,
        busyPeriods,
      );
    }

    return ResponseHelper.success(
      'Available slots found',
      HttpStatus.OK,
      response,
    );
  }

  public async findBookableServices(): Promise<ResponseDto> {
    const services = await this._bookableOffersQuery()
      .select('service.uuid', 'uuid')
      .addSelect('service.name', 'name')
      .addSelect('service.description', 'description')
      .addSelect('MIN(userService.price)', 'minPrice')
      .addSelect('MAX(userService.price)', 'maxPrice')
      .addSelect('MIN(userService.duration)', 'minDuration')
      .addSelect('MAX(userService.duration)', 'maxDuration')
      .distinct(false)
      .groupBy('service.uuid')
      .addGroupBy('service.name')
      .addGroupBy('service.description')
      .orderBy('service.name', 'ASC')
      .getRawMany<BookableService>();

    return ResponseHelper.success(
      'Bookable services found',
      HttpStatus.OK,
      services.map(service => ({
        ...service,
        minPrice: Number(service.minPrice),
        maxPrice: Number(service.maxPrice),
        minDuration: Number(service.minDuration),
        maxDuration: Number(service.maxDuration),
      })),
    );
  }

  public async findBookableEmployees(serviceId: string): Promise<ResponseDto> {
    const employees = await this._bookableOffersQuery(serviceId)
      .addSelect('user.firstName', 'firstName')
      .addSelect('user.lastName', 'lastName')
      .addSelect('userService.price', 'price')
      .orderBy('user.lastName', 'ASC')
      .addOrderBy('user.firstName', 'ASC')
      .getRawMany<BookableEmployee>();

    if (employees.length === 0) await this._assertServiceBookable(serviceId);

    const response: BookableEmployeesResponse = {
      serviceId,
      employees: employees.map(employee => ({
        ...employee,
        price: Number(employee.price),
        duration: Number(employee.duration),
      })),
    };

    return ResponseHelper.success(
      'Bookable employees found',
      HttpStatus.OK,
      response,
    );
  }

  // Single source of what can be booked, shared by all public booking endpoints
  private _bookableOffersQuery(
    serviceId?: string,
  ): SelectQueryBuilder<UsersServices> {
    const qb = this.usersServicesRepository
      .createQueryBuilder('userService')
      .innerJoin('userService.user', 'user')
      .innerJoin('userService.service', 'service')
      // Bookings are stored in the employee's default calendar
      .innerJoin(
        Calendar,
        'calendar',
        'calendar.owner = user.uuid AND calendar.isDefault = true AND calendar.active = true AND calendar.deleted = false',
      )
      .select('userService.uuid', 'userServiceId')
      .addSelect('user.uuid', 'employeeId')
      .addSelect('userService.duration', 'duration')
      .where('service.active = true')
      .andWhere('service.deleted = false')
      .andWhere('userService.active = true')
      .andWhere('user.active = true')
      .andWhere('user.deleted = false')
      .distinct(true);

    if (serviceId) qb.andWhere('service.uuid = :serviceId', { serviceId });

    return qb;
  }

  private async _findBookableOffers(
    serviceId: string,
    employeeId?: string,
  ): Promise<BookableOffer[]> {
    const qb = this._bookableOffersQuery(serviceId);

    if (employeeId) qb.andWhere('user.uuid = :employeeId', { employeeId });

    const offers = await qb.getRawMany<BookableOffer>();

    return offers.map(offer => ({
      ...offer,
      duration: Number(offer.duration),
    }));
  }

  // Runs only when nothing is bookable, to tell a missing service from a fully unavailable one
  private async _assertServiceBookable(
    serviceId: string,
    employeeId?: string,
  ): Promise<void> {
    const serviceExists = await this.serviceRepository.exists({
      where: { uuid: serviceId, active: true, deleted: false },
    });

    if (!serviceExists) throw new ServiceNotFoundException();
    if (employeeId) throw new BookingEmployeeUnavailableException();
  }

  // Only client appointments block slots; internal events never do
  private async _findBusyPeriods(
    salon: Salon,
    date: string,
    offers: BookableOffer[],
    excludeAppointmentId?: string,
  ): Promise<Map<string, BusyPeriod[]>> {
    const query = this.appointmentRepository
      .createQueryBuilder('appointment')
      .innerJoin('appointment.calendar', 'calendar')
      .innerJoin('calendar.owner', 'owner')
      .select('owner.uuid', 'employeeId')
      .addSelect('appointment.scheduledAt', 'startsAt')
      .addSelect('appointment.scheduledEndAt', 'endsAt')
      .where('owner.uuid IN (:...employeeIds)', {
        employeeIds: [...new Set(offers.map(offer => offer.employeeId))],
      })
      .andWhere('appointment.type = :type', { type: AppointmentType.CLIENT })
      .andWhere('appointment.status != :cancelled', {
        cancelled: AppointmentStatus.CANCELLED,
      })
      .andWhere('appointment.deleted = false')
      .andWhere('appointment.scheduledAt < :dayEnd', {
        dayEnd: fromLocalDateTime(addDays(date, 1), 0, salon.timeZone),
      })
      .andWhere('appointment.scheduledEndAt > :dayStart', {
        dayStart: fromLocalDateTime(date, 0, salon.timeZone),
      });

    // A rescheduled appointment must not block its own time
    if (excludeAppointmentId) {
      query.andWhere('appointment.uuid != :excludeAppointmentId', {
        excludeAppointmentId,
      });
    }

    const appointments = await query.getRawMany<{
      employeeId: string;
      startsAt: Date;
      endsAt: Date;
    }>();

    const busyPeriods = new Map<string, BusyPeriod[]>();

    for (const { employeeId, startsAt, endsAt } of appointments) {
      const periods = busyPeriods.get(employeeId) ?? [];
      periods.push({
        startsAt: new Date(startsAt).getTime(),
        endsAt: new Date(endsAt).getTime(),
      });
      busyPeriods.set(employeeId, periods);
    }

    return busyPeriods;
  }

  private _buildSlots(
    salon: Salon,
    date: string,
    openingRanges: TimeRange[],
    offers: BookableOffer[],
    busyPeriods: Map<string, BusyPeriod[]>,
  ): AvailableSlot[] {
    const now = Date.now();
    const earliestStart = now + salon.clientMinLeadTimeMinutes * MINUTE_MS;
    const latestStart = now + salon.maxBookingDaysAhead * DAY_MS;
    const slots: AvailableSlot[] = [];

    for (const range of openingRanges) {
      const closesAt = toMinutes(range.closesAt);

      for (
        let minutes = toMinutes(range.opensAt);
        minutes < closesAt;
        minutes += salon.slotIntervalMinutes
      ) {
        const startsAt = fromLocalDateTime(
          date,
          minutes,
          salon.timeZone,
        ).getTime();
        if (startsAt < earliestStart || startsAt > latestStart) continue;

        const userServiceIds = offers
          .filter(offer => {
            if (minutes + offer.duration > closesAt) return false;

            const endsAt = startsAt + offer.duration * MINUTE_MS;

            return !(busyPeriods.get(offer.employeeId) ?? []).some(
              busy => busy.startsAt < endsAt && busy.endsAt > startsAt,
            );
          })
          .map(offer => offer.userServiceId);

        if (userServiceIds.length > 0) {
          slots.push({
            time: toTime(minutes),
            startsAt: new Date(startsAt).toISOString(),
            userServiceIds,
          });
        }
      }
    }

    return slots;
  }
}
