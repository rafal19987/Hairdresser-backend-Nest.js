import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Calendar } from '@/calendar/entities/calendar.entity';
import { CalendarShare } from '@/calendar-share/entities/calendar-share.entity';
import {
  USERS_SERVICE,
  UsersServiceInterface,
} from '@/users/interfaces/users-service.interface';
import { Resource } from '@/roles/enums/resource.enum';
import { Action } from '@/roles/enums/action.enum';
import {
  CalendarAccess,
  VisibleCalendar,
} from '@/calendar/interfaces/visible-calendar.interface';

@Injectable()
export class CalendarAccessService {
  constructor(
    @InjectRepository(Calendar)
    private readonly calendarRepository: Repository<Calendar>,
    @InjectRepository(CalendarShare)
    private readonly calendarShareRepository: Repository<CalendarShare>,
    @Inject(USERS_SERVICE)
    private readonly usersService: UsersServiceInterface,
  ) {}

  // Own calendars first, then shared ones, then the rest (only with the `all` action)
  public async findVisibleCalendars(
    userId: string,
  ): Promise<VisibleCalendar[]> {
    const [canSeeAll, ownCalendars, shares] = await Promise.all([
      this._canSeeAllCalendars(userId),
      this._activeCalendarsQuery()
        .andWhere('owner.uuid = :userId', { userId })
        .getMany(),
      this.calendarShareRepository.find({
        where: {
          sharedWith: { uuid: userId },
          active: true,
          calendar: { active: true, deleted: false },
        },
      }),
    ]);

    const visible = new Map<string, VisibleCalendar>();
    const add = (
      calendar: Calendar,
      access: CalendarAccess,
      permission: string,
    ) => {
      if (!visible.has(calendar.uuid)) {
        visible.set(
          calendar.uuid,
          this._toVisible(calendar, access, permission),
        );
      }
    };

    ownCalendars.forEach(calendar => add(calendar, 'owner', 'full'));
    shares
      .filter(
        share => share.calendar.owner?.active && !share.calendar.owner.deleted,
      )
      .forEach(share => add(share.calendar, 'shared', share.permission));

    if (canSeeAll) {
      const allCalendars = await this._activeCalendarsQuery().getMany();
      allCalendars.forEach(calendar => add(calendar, 'all', 'write'));
    }

    return [...visible.values()];
  }

  public async assertCanRead(
    userId: string,
    calendarUuids: string[],
  ): Promise<void> {
    const visible = new Set(
      (await this.findVisibleCalendars(userId)).map(calendar => calendar.uuid),
    );

    if (calendarUuids.some(uuid => !visible.has(uuid))) {
      throw new ForbiddenException('Brak dostępu do wybranego kalendarza');
    }
  }

  private async _canSeeAllCalendars(userId: string): Promise<boolean> {
    const permissions = await this.usersService.getUserPermissions(userId);

    return permissions.some(
      permission =>
        permission.resource === Resource.CALENDAR &&
        permission.actions.includes(Action.ALL),
    );
  }

  private _activeCalendarsQuery() {
    return this.calendarRepository
      .createQueryBuilder('calendar')
      .innerJoinAndSelect('calendar.owner', 'owner')
      .where('calendar.active = true')
      .andWhere('calendar.deleted = false')
      .andWhere('owner.active = true')
      .andWhere('owner.deleted = false')
      .orderBy('owner.firstName', 'ASC')
      .addOrderBy('owner.lastName', 'ASC')
      .addOrderBy('calendar.isDefault', 'DESC')
      .addOrderBy('calendar.name', 'ASC');
  }

  private _toVisible(
    calendar: Calendar,
    access: CalendarAccess,
    permission: string,
  ): VisibleCalendar {
    return {
      uuid: calendar.uuid,
      name: calendar.name,
      color: calendar.color ?? null,
      isDefault: calendar.isDefault,
      access,
      permission,
      owner: {
        uuid: calendar.owner.uuid,
        firstName: calendar.owner.firstName,
        lastName: calendar.owner.lastName,
      },
    };
  }
}
