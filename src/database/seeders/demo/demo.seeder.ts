import { DataSource, EntityManager } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Role } from '@/roles/entities/role.entity';
import { User } from '@/users/entities/user.entity';
import { Calendar } from '@/calendar/entities/calendar.entity';
import { Service } from '@/services/entities/service.entity';
import { UsersServices } from '@/users-services/entities/users-services.entity';
import { Client } from '@/clients/entities/client.entity';
import { Appointment } from '@/appointment/entities/appointment.entity';
import { AppointmentStatus } from '@/appointment/enums/appointment-status.enum';
import { AppointmentType } from '@/appointment/enums/appointment-type.enum';
import { CancelledBy } from '@/appointment/enums/appointment-cancelled-by.enum';
import { RescheduledBy } from '@/appointment/enums/appointment-rescheduled-by.enum';
import { Salon } from '@/salon/entities/salon.entity';
import { SalonOpeningHours } from '@/salon/entities/salon-opening-hours.entity';
import { SalonSpecialDay } from '@/salon/entities/salon-special-day.entity';
import { findDefaultSalon } from '@/salon/helpers/default-salon.helper';
import {
  addDays,
  formatLocalDate,
  fromLocalDateTime,
  isoDayOfWeek,
  TimeRange,
  toMinutes,
} from '@/salon/helpers/time.helper';
import {
  DEMO_CLIENT_PASSWORD,
  DEMO_CLIENTS,
  DEMO_DAYS_AHEAD,
  DEMO_DAYS_BACK,
  DEMO_EMPLOYEE_PASSWORD,
  DEMO_EMPLOYEE_ROLE,
  DEMO_EMPLOYEES,
  DEMO_GUESTS,
  DEMO_INTERNAL_EVENTS,
  DEMO_SERVICES,
  DemoServiceKey,
} from './demo-data';

const MINUTE_MS = 60 * 1000;

interface SeededEmployee {
  user: User;
  calendar: Calendar;
  offers: UsersServices[];
}

export async function seedDemoData(dataSource: DataSource): Promise<void> {
  const salon = await findDefaultSalon(dataSource.getRepository(Salon));

  if (!salon) {
    console.log('Demo data skipped: salon is not configured.');
    return;
  }

  const alreadySeeded = await dataSource
    .getRepository(User)
    .exists({ where: { email: DEMO_EMPLOYEES[0].email } });

  if (alreadySeeded) {
    console.log('Demo data already exists.');
    return;
  }

  await dataSource.transaction(async manager => {
    const role = await seedEmployeeRole(manager);
    const services = await seedServices(manager);
    const employees = await seedEmployees(manager, role, services);
    const clients = await seedClients(manager);
    await seedSpecialDays(manager, salon);
    const count = await seedAppointments(manager, salon, employees, clients);

    console.log(
      `Demo data created: ${employees.length} employees, ${Object.keys(services).length} services, ${clients.length} clients, ${count} appointments.`,
    );
  });

  console.log(
    `Demo employees (password ${DEMO_EMPLOYEE_PASSWORD}): ${DEMO_EMPLOYEES.map(e => e.email).join(', ')}`,
  );
  console.log(
    `Demo clients (password ${DEMO_CLIENT_PASSWORD}): ${DEMO_CLIENTS.map(c => c.email).join(', ')}`,
  );
}

async function seedEmployeeRole(manager: EntityManager): Promise<Role> {
  const repository = manager.getRepository(Role);
  const existing = await repository.findOneBy({
    name: DEMO_EMPLOYEE_ROLE.name,
  });

  return existing ?? repository.save(repository.create(DEMO_EMPLOYEE_ROLE));
}

// Archived services keep their unique name, so they are skipped instead of recreated
async function seedServices(
  manager: EntityManager,
): Promise<Partial<Record<DemoServiceKey, Service>>> {
  const repository = manager.getRepository(Service);
  const services: Partial<Record<DemoServiceKey, Service>> = {};

  for (const [key, data] of Object.entries(DEMO_SERVICES)) {
    const existing = await repository.findOne({
      where: { name: data.name },
      withDeleted: true,
    });

    if (existing?.deleted || existing?.deletedAt) {
      console.log(`Demo service "${data.name}" skipped: it is archived.`);
      continue;
    }

    services[key as DemoServiceKey] =
      existing ??
      (await repository.save(repository.create({ ...data, active: true })));
  }

  return services;
}

async function seedEmployees(
  manager: EntityManager,
  role: Role,
  services: Partial<Record<DemoServiceKey, Service>>,
): Promise<SeededEmployee[]> {
  const password = await bcrypt.hash(DEMO_EMPLOYEE_PASSWORD, 10);
  const seeded: SeededEmployee[] = [];

  for (const employee of DEMO_EMPLOYEES) {
    const user = await manager.getRepository(User).save(
      manager.getRepository(User).create({
        email: employee.email,
        username: employee.email,
        firstName: employee.firstName,
        lastName: employee.lastName,
        password,
        active: true,
        role,
      }),
    );

    const calendar = await manager.getRepository(Calendar).save(
      manager.getRepository(Calendar).create({
        name: `Kalendarz — ${employee.firstName}`,
        owner: user,
        color: employee.calendarColor,
        isDefault: true,
        active: true,
      }),
    );

    const offers = await manager.getRepository(UsersServices).save(
      employee.offers
        .filter(offer => services[offer.service])
        .map(offer =>
          manager.getRepository(UsersServices).create({
            user,
            service: services[offer.service],
            price: offer.price,
            duration: offer.duration,
            active: true,
          }),
        ),
    );

    seeded.push({ user, calendar, offers });
  }

  return seeded;
}

async function seedClients(manager: EntityManager): Promise<Client[]> {
  const repository = manager.getRepository(Client);
  const password = await bcrypt.hash(DEMO_CLIENT_PASSWORD, 10);

  return repository.save(
    DEMO_CLIENTS.map(client =>
      repository.create({
        ...client,
        password,
        emailVerified: true,
        emailVerificationDate: new Date(),
        active: true,
      }),
    ),
  );
}

// Christmas special days for the upcoming season
async function seedSpecialDays(
  manager: EntityManager,
  salon: Salon,
): Promise<void> {
  const repository = manager.getRepository(SalonSpecialDay);
  const today = formatLocalDate(new Date(), salon.timeZone);
  const year =
    today > `${today.slice(0, 4)}-12-26`
      ? Number(today.slice(0, 4)) + 1
      : Number(today.slice(0, 4));

  const days = [
    {
      date: `${year}-12-24`,
      name: 'Wigilia',
      isClosed: false,
      hours: [{ opensAt: '09:00', closesAt: '13:00' }],
    },
    {
      date: `${year}-12-25`,
      name: 'Boże Narodzenie',
      isClosed: true,
      hours: [],
    },
    {
      date: `${year}-12-26`,
      name: 'Drugi dzień świąt',
      isClosed: true,
      hours: [],
    },
  ];

  for (const day of days) {
    const exists = await repository.exists({
      where: { date: day.date, salon: { uuid: salon.uuid } },
    });

    if (!exists) await repository.save(repository.create({ ...day, salon }));
  }
}

async function seedAppointments(
  manager: EntityManager,
  salon: Salon,
  employees: SeededEmployee[],
  clients: Client[],
): Promise<number> {
  const openingRanges = await loadOpeningRanges(manager, salon);
  const today = formatLocalDate(new Date(), salon.timeZone);
  const now = Date.now();
  const appointments: Appointment[] = [];
  let index = 0;
  let rescheduled = false;

  for (let offset = -DEMO_DAYS_BACK; offset <= DEMO_DAYS_AHEAD; offset++) {
    const date = addDays(today, offset);
    const ranges = openingRanges(date);

    employees.forEach((employee, employeeIndex) => {
      DEMO_EMPLOYEES[employeeIndex].dailyStarts.forEach((start, slotIndex) => {
        // Leave roughly a third of the slots free so the booking page has availability
        if ((offset + slotIndex + employeeIndex + DEMO_DAYS_BACK) % 3 === 0)
          return;

        const offer =
          employee.offers[
            (offset + slotIndex + DEMO_DAYS_BACK) % employee.offers.length
          ];
        const end = start + offer.duration;
        const fits = ranges.some(
          range =>
            toMinutes(range.opensAt) <= start &&
            end <= toMinutes(range.closesAt),
        );
        if (!fits) return;

        const scheduledAt = fromLocalDateTime(date, start, salon.timeZone);
        const scheduledEndAt = new Date(
          scheduledAt.getTime() + offer.duration * MINUTE_MS,
        );
        const isPast = scheduledEndAt.getTime() < now;
        const client = index % 3 === 0 ? clients[index % clients.length] : null;
        const guest = DEMO_GUESTS[index % DEMO_GUESTS.length];

        const appointment = manager.getRepository(Appointment).create({
          name: `${offer.service.name} — ${employee.user.firstName} ${employee.user.lastName}`,
          calendar: employee.calendar,
          userService: offer,
          client,
          clientName: client ? null : guest.name,
          clientEmail: client?.email ?? guest.email,
          clientPhone: client?.phone ?? guest.phone,
          price: offer.price,
          duration: offer.duration,
          type: AppointmentType.CLIENT,
          scheduledAt,
          scheduledEndAt,
          status: pickStatus(isPast, index),
        });

        if (appointment.status === AppointmentStatus.CANCELLED) {
          appointment.cancelledBy = CancelledBy.CLIENT;
          appointment.cancelledAt = new Date(
            scheduledAt.getTime() - 2 * 24 * 60 * MINUTE_MS,
          );
          appointment.cancellationReason = 'Zmiana planów';
        }

        if (
          !isPast &&
          !rescheduled &&
          appointment.status === AppointmentStatus.CONFIRMED
        ) {
          rescheduled = true;
          appointment.status = AppointmentStatus.RESCHEDULED;
          appointment.previousScheduledAt = new Date(
            scheduledAt.getTime() - 24 * 60 * MINUTE_MS,
          );
          appointment.previousScheduledEndAt = new Date(
            scheduledEndAt.getTime() - 24 * 60 * MINUTE_MS,
          );
          appointment.rescheduledBy = RescheduledBy.CLIENT;
          appointment.rescheduledAt = new Date(now);
          appointment.rescheduleReason = 'Wyjazd służbowy';
        }

        appointments.push(appointment);
        index++;
      });
    });
  }

  for (const event of DEMO_INTERNAL_EVENTS) {
    const employee = employees[event.employee];
    const date = addDays(today, event.dayOffset);
    const scheduledAt = fromLocalDateTime(date, event.start, salon.timeZone);

    appointments.push(
      manager.getRepository(Appointment).create({
        name: event.name,
        calendar: employee.calendar,
        type: AppointmentType.INTERNAL,
        status: AppointmentStatus.CONFIRMED,
        duration: event.end - event.start,
        scheduledAt,
        scheduledEndAt: fromLocalDateTime(date, event.end, salon.timeZone),
      }),
    );
  }

  await manager.getRepository(Appointment).save(appointments);

  return appointments.length;
}

function pickStatus(isPast: boolean, index: number): AppointmentStatus {
  if (index % 7 === 3) return AppointmentStatus.CANCELLED;
  if (isPast) return AppointmentStatus.COMPLETED;
  return index % 4 === 0
    ? AppointmentStatus.PENDING
    : AppointmentStatus.CONFIRMED;
}

async function loadOpeningRanges(
  manager: EntityManager,
  salon: Salon,
): Promise<(date: string) => TimeRange[]> {
  const [weekly, specialDays] = await Promise.all([
    manager.getRepository(SalonOpeningHours).find({
      where: { salon: { uuid: salon.uuid } },
    }),
    manager.getRepository(SalonSpecialDay).find({
      where: { salon: { uuid: salon.uuid } },
      relations: { hours: true },
    }),
  ]);

  return (date: string) => {
    const specialDay = specialDays.find(day => day.date === date);
    if (specialDay) return specialDay.hours;

    return weekly.filter(hours => hours.dayOfWeek === isoDayOfWeek(date));
  };
}
