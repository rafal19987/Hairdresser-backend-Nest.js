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
import { BookingEmployeeUnavailableException } from '@/booking/exceptions/booking-employee-unavailable.exception';
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
    @Inject(SALON_SERVICE)
    private readonly salonService: SalonServiceInterface,
  ) {}

  public async findAvailableSlots({
    serviceId,
    date,
    employeeId,
  }: AvailableSlotsQueryDto): Promise<ResponseDto> {
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
      const busyPeriods = await this._findBusyPeriods(salon, date, offers);
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

  // Single source of who can be booked, shared by slots and the employee list
  private _bookableOffersQuery(
    serviceId: string,
  ): SelectQueryBuilder<UsersServices> {
    return (
      this.usersServicesRepository
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
        .where('service.uuid = :serviceId', { serviceId })
        .andWhere('service.active = true')
        .andWhere('service.deleted = false')
        .andWhere('userService.active = true')
        .andWhere('user.active = true')
        .andWhere('user.deleted = false')
        .distinct(true)
    );
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
  ): Promise<Map<string, BusyPeriod[]>> {
    const appointments = await this.appointmentRepository
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
      })
      .getRawMany<{ employeeId: string; startsAt: Date; endsAt: Date }>();

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
