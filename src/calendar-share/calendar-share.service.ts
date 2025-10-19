import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateCalendarShareDto } from './dto/create-calendar-share.dto';
import { UpdateCalendarShareDto } from './dto/update-calendar-share.dto';
import { CalendarShare } from './entities/calendar-share.entity';
import { Calendar } from '@/calendar/entities/calendar.entity';
import { User } from '@/users/entities/user.entity';
import { CalendarShareServiceInterface } from '@/calendar-share/interfaces/calendar-share-service.interface';
import { ResponseDto } from '@/common/dto/response.dto';
import { PaginationParamsDto } from '@/common/dto/pagination-params.dto';
import { PaginatedResultDto } from '@/common/dto/paginated-result.dto';
import { createPaginatedResponse } from '@/common/helpers/pagination.helper';
import { ResponseHelper } from '@/common/helpers/response.helper';
import { CalendarShareNotFoundException } from './exceptions/calendar-share-not-found.exception';
import { CalendarShareAlreadyExistsException } from './exceptions/calendar-share-already-exists.exception';
import { CalendarShareSelfShareException } from './exceptions/calendar-share-self-share.exception';
import { CalendarSharePermissionException } from './exceptions/calendar-share-permission.exception';
import { CalendarNotFoundException } from '@/calendar/exceptions/calendar-not-found.exception';
import { UserNotFoundException } from '@/users/exceptions/user-not-found.exception';

@Injectable()
export class CalendarShareService implements CalendarShareServiceInterface {
  constructor(
    @InjectRepository(CalendarShare)
    private readonly calendarShareRepository: Repository<CalendarShare>,
    @InjectRepository(Calendar)
    private readonly calendarRepository: Repository<Calendar>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  public async create(
    createCalendarShareDto: CreateCalendarShareDto,
  ): Promise<ResponseDto> {
    // Sprawdź czy kalendarz istnieje
    const calendar = await this.calendarRepository.findOne({
      where: { uuid: createCalendarShareDto.calendarId },
      relations: ['owner'],
    });

    if (!calendar) {
      throw new CalendarNotFoundException();
    }

    // Znajdź użytkownika do udostępnienia (przez UUID lub email)
    let sharedWithUser: User | null = null;

    if (createCalendarShareDto.sharedWithUserId) {
      sharedWithUser = await this.userRepository.findOneBy({
        uuid: createCalendarShareDto.sharedWithUserId,
      });
    } else if (createCalendarShareDto.sharedWithEmail) {
      sharedWithUser = await this.userRepository.findOneBy({
        email: createCalendarShareDto.sharedWithEmail,
      });
    }

    if (!sharedWithUser) {
      throw new UserNotFoundException(
        'Użytkownik do udostępnienia nie został znaleziony',
      );
    }

    // Sprawdź czy użytkownik nie próbuje udostępnić kalendarza samemu sobie
    if (calendar.owner.uuid === sharedWithUser.uuid) {
      throw new CalendarShareSelfShareException();
    }

    // Sprawdź czy udostępnienie już istnieje
    const existingShare = await this.calendarShareRepository.findOne({
      where: {
        calendar: { uuid: createCalendarShareDto.calendarId },
        sharedWith: { uuid: sharedWithUser.uuid },
      },
    });

    if (existingShare) {
      throw new CalendarShareAlreadyExistsException();
    }

    // Utwórz udostępnienie
    const calendarShare = await this.calendarShareRepository.save({
      calendar,
      sharedWith: sharedWithUser,
      permission: createCalendarShareDto.permission,
      active: createCalendarShareDto.active ?? true,
    });

    return ResponseHelper.created('Kalendarz został udostępniony pomyślnie', {
      uuid: calendarShare.uuid,
      calendarName: calendar.name,
      sharedWith: sharedWithUser.email,
      permission: calendarShare.permission,
    });
  }

  public async findAll(
    paginationParams: PaginationParamsDto,
    userId?: string,
  ): Promise<PaginatedResultDto<CalendarShare>> {
    const { page, limit, query } = paginationParams;
    const skip = (page - 1) * limit;

    const qb = this.calendarShareRepository
      .createQueryBuilder('calendarShare')
      .leftJoinAndSelect('calendarShare.calendar', 'calendar')
      .leftJoinAndSelect('calendarShare.sharedWith', 'sharedWith')
      .leftJoinAndSelect('calendar.owner', 'owner')
      .where('calendarShare.active = :active', { active: true })
      .orderBy('calendarShare.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    if (userId) {
      qb.andWhere(
        '(calendar.owner.uuid = :userId OR calendarShare.sharedWith.uuid = :userId)',
        { userId },
      );
    }

    if (query) {
      qb.andWhere(
        `(
          calendar.name LIKE :query OR
          sharedWith.email LIKE :query OR
          sharedWith.firstName LIKE :query OR
          sharedWith.lastName LIKE :query
        )`,
        { query: `%${query}%` },
      );
    }

    const [shares, total] = await qb.getManyAndCount();

    if (!shares || shares.length === 0) {
      return createPaginatedResponse([], 0, paginationParams);
    }

    return createPaginatedResponse(shares, total, paginationParams);
  }

  public async findOne(uuid: string): Promise<ResponseDto> {
    const calendarShare = await this.calendarShareRepository.findOne({
      where: { uuid },
      relations: ['calendar', 'calendar.owner', 'sharedWith'],
    });

    if (!calendarShare) {
      throw new CalendarShareNotFoundException();
    }

    return ResponseHelper.success(
      'Udostępnienie kalendarza znalezione',
      HttpStatus.OK,
      calendarShare,
    );
  }

  public async findByCalendar(
    calendarId: string,
    paginationParams: PaginationParamsDto,
  ): Promise<PaginatedResultDto<CalendarShare>> {
    const { page, limit } = paginationParams;
    const skip = (page - 1) * limit;

    const [shares, total] = await this.calendarShareRepository.findAndCount({
      where: {
        calendar: { uuid: calendarId },
        active: true,
      },
      relations: ['calendar', 'sharedWith'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return createPaginatedResponse(shares, total, paginationParams);
  }

  public async findBySharedUser(
    userId: string,
    paginationParams: PaginationParamsDto,
  ): Promise<PaginatedResultDto<CalendarShare>> {
    const { page, limit } = paginationParams;
    const skip = (page - 1) * limit;

    const [shares, total] = await this.calendarShareRepository.findAndCount({
      where: {
        sharedWith: { uuid: userId },
        active: true,
      },
      relations: ['calendar', 'calendar.owner', 'sharedWith'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return createPaginatedResponse(shares, total, paginationParams);
  }

  public async update(
    uuid: string,
    updateCalendarShareDto: UpdateCalendarShareDto,
  ): Promise<ResponseDto> {
    const calendarShare = await this.calendarShareRepository.findOne({
      where: { uuid },
      relations: ['calendar', 'sharedWith'],
    });

    if (!calendarShare) {
      throw new CalendarShareNotFoundException();
    }

    // Aktualizuj udostępnienie
    Object.assign(calendarShare, {
      permission: updateCalendarShareDto.permission ?? calendarShare.permission,
      active: updateCalendarShareDto.active ?? calendarShare.active,
    });

    await this.calendarShareRepository.save(calendarShare);

    return ResponseHelper.updated(
      'Udostępnienie kalendarza zostało zaktualizowane',
      {
        uuid: calendarShare.uuid,
      },
    );
  }

  public async remove(uuid: string): Promise<ResponseDto> {
    const calendarShare = await this.calendarShareRepository.findOne({
      where: { uuid },
    });

    if (!calendarShare) {
      throw new CalendarShareNotFoundException();
    }

    await this.calendarShareRepository.remove(calendarShare);

    return ResponseHelper.deleted('Udostępnienie kalendarza zostało usunięte');
  }

  public async revokeAccess(uuid: string): Promise<ResponseDto> {
    const calendarShare = await this.calendarShareRepository.findOne({
      where: { uuid },
      relations: ['calendar', 'sharedWith'],
    });

    if (!calendarShare) {
      throw new CalendarShareNotFoundException();
    }

    calendarShare.active = false;
    await this.calendarShareRepository.save(calendarShare);

    return ResponseHelper.success(
      'Dostęp do kalendarza został cofnięty',
      HttpStatus.OK,
      { uuid: calendarShare.uuid },
    );
  }

  public async checkUserAccess(
    calendarId: string,
    userId: string,
  ): Promise<CalendarShare | null> {
    // Najpierw sprawdź czy użytkownik jest właścicielem kalendarza
    const calendar = await this.calendarRepository.findOne({
      where: { uuid: calendarId },
      relations: ['owner'],
    });

    if (calendar && calendar.owner.uuid === userId) {
      // Właściciel ma pełne uprawnienia
      return {
        uuid: 'owner',
        calendar,
        sharedWith: calendar.owner,
        permission: 'full',
        active: true,
        canRead: () => true,
        canCreate: () => true,
        canWrite: () => true,
        canDelete: () => true,
      } as CalendarShare;
    }

    // Sprawdź udostępnienia
    const share = await this.calendarShareRepository.findOne({
      where: {
        calendar: { uuid: calendarId },
        sharedWith: { uuid: userId },
        active: true,
      },
      relations: ['calendar', 'sharedWith'],
    });

    return share;
  }

  public async updatePermission(
    uuid: string,
    permission: string,
  ): Promise<ResponseDto> {
    const calendarShare = await this.calendarShareRepository.findOne({
      where: { uuid },
      relations: ['calendar', 'sharedWith'],
    });

    if (!calendarShare) {
      throw new CalendarShareNotFoundException();
    }

    // Walidacja poziomu uprawnień
    const validPermissions = ['read', 'create', 'write', 'full'];
    if (!validPermissions.includes(permission)) {
      throw new CalendarSharePermissionException(
        'Nieprawidłowy poziom uprawnień',
      );
    }

    calendarShare.permission = permission;
    await this.calendarShareRepository.save(calendarShare);

    return ResponseHelper.success(
      'Uprawnienia zostały zaktualizowane',
      HttpStatus.OK,
      {
        uuid: calendarShare.uuid,
        permission: calendarShare.permission,
      },
    );
  }
}
