import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CalendarAccessService } from '@/calendar/calendar-access.service';
import { Calendar } from '@/calendar/entities/calendar.entity';
import { CalendarShare } from '@/calendar-share/entities/calendar-share.entity';
import { USERS_SERVICE } from '@/users/interfaces/users-service.interface';
import { Resource } from '@/roles/enums/resource.enum';
import { Action } from '@/roles/enums/action.enum';

const owner = (uuid: string, overrides: Record<string, unknown> = {}) => ({
  uuid,
  firstName: uuid,
  lastName: 'Test',
  active: true,
  deleted: false,
  ...overrides,
});

const calendar = (uuid: string, ownerUuid: string) =>
  ({
    uuid,
    name: `Kalendarz ${uuid}`,
    color: '#000000',
    isDefault: true,
    owner: owner(ownerUuid),
  }) as unknown as Calendar;

describe('CalendarAccessService', () => {
  let service: CalendarAccessService;

  const ownQueryBuilder = {
    innerJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
  };
  const calendarRepository = { createQueryBuilder: jest.fn() };
  const calendarShareRepository = { find: jest.fn() };
  const usersService = { getUserPermissions: jest.fn() };

  const calendarPermissions = (actions: Action[]) => [
    { resource: Resource.CALENDAR, actions },
  ];

  beforeEach(async () => {
    jest.clearAllMocks();
    calendarRepository.createQueryBuilder.mockReturnValue(ownQueryBuilder);
    ownQueryBuilder.getMany.mockResolvedValue([calendar('own', 'me')]);
    calendarShareRepository.find.mockResolvedValue([]);
    usersService.getUserPermissions.mockResolvedValue(
      calendarPermissions([Action.READ]),
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CalendarAccessService,
        { provide: getRepositoryToken(Calendar), useValue: calendarRepository },
        {
          provide: getRepositoryToken(CalendarShare),
          useValue: calendarShareRepository,
        },
        { provide: USERS_SERVICE, useValue: usersService },
      ],
    }).compile();

    service = module.get(CalendarAccessService);
  });

  it('shows own and shared calendars without the all action', async () => {
    calendarShareRepository.find.mockResolvedValue([
      { calendar: calendar('anna', 'anna'), permission: 'read' },
    ]);

    const visible = await service.findVisibleCalendars('me');

    expect(visible.map(c => [c.uuid, c.access, c.permission])).toEqual([
      ['own', 'owner', 'full'],
      ['anna', 'shared', 'read'],
    ]);
    expect(calendarRepository.createQueryBuilder).toHaveBeenCalledTimes(1);
  });

  it('skips calendars shared by inactive or deleted employees', async () => {
    calendarShareRepository.find.mockResolvedValue([
      {
        calendar: {
          ...calendar('gone', 'gone'),
          owner: owner('gone', { active: false }),
        },
        permission: 'read',
      },
      {
        calendar: {
          ...calendar('removed', 'removed'),
          owner: owner('removed', { deleted: true }),
        },
        permission: 'read',
      },
    ]);

    const visible = await service.findVisibleCalendars('me');

    expect(visible.map(c => c.uuid)).toEqual(['own']);
  });

  it('adds every active calendar with the all action, keeping own and shared access', async () => {
    usersService.getUserPermissions.mockResolvedValue(
      calendarPermissions([Action.READ, Action.ALL]),
    );
    calendarShareRepository.find.mockResolvedValue([
      { calendar: calendar('anna', 'anna'), permission: 'read' },
    ]);
    ownQueryBuilder.getMany
      .mockResolvedValueOnce([calendar('own', 'me')])
      .mockResolvedValueOnce([
        calendar('anna', 'anna'),
        calendar('own', 'me'),
        calendar('tomasz', 'tomasz'),
      ]);

    const visible = await service.findVisibleCalendars('me');

    expect(visible.map(c => [c.uuid, c.access])).toEqual([
      ['own', 'owner'],
      ['anna', 'shared'],
      ['tomasz', 'all'],
    ]);
  });

  it('rejects reading a calendar that is not visible', async () => {
    await expect(
      service.assertCanRead('me', ['own', 'someone-else']),
    ).rejects.toBeInstanceOf(ForbiddenException);
    await expect(service.assertCanRead('me', ['own'])).resolves.toBeUndefined();
  });
});
