import { HttpStatus, Injectable } from '@nestjs/common';
import { CreateCalendarDto } from './dto/create-calendar.dto';
import { UpdateCalendarDto } from './dto/update-calendar.dto';
import { CalendarsServiceInterface } from '@/calendar/interfaces/calendars-service.interface';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '@/users/entities/user.entity';
import { Calendar } from '@/calendar/entities/calendar.entity';
import { Not, Repository } from 'typeorm';
import { CalendarNotFoundException } from '@/calendar/exceptions/calendar-not-found.exception';
import { ResponseDto } from '@/common/dto/response.dto';
import { ResponseHelper } from '@/common/helpers/response.helper';
import { CalendarIsNotDeletedException } from '@/calendar/exceptions/calendar-is-not-daleted.exception';
import { CalendarAlreadyExistsException } from '@/calendar/exceptions/calendar-already-exists.exception';
import { UserNotFoundException } from '@/users/exceptions/user-not-found.exception';
import { createPaginatedResponse } from '@/common/helpers/pagination.helper';
import { PaginatedResultDto } from '@/common/dto/paginated-result.dto';
import { PaginationParamsDto } from '@/common/dto/pagination-params.dto';

@Injectable()
export class CalendarService implements CalendarsServiceInterface {
  constructor(
    @InjectRepository(Calendar)
    private readonly calendarRepository: Repository<Calendar>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  public async create(
    createCalendarDto: CreateCalendarDto,
  ): Promise<ResponseDto> {
    const owner = await this.userRepository.findOneBy({
      uuid: createCalendarDto.ownerId,
    });

    if (!owner) {
      throw new UserNotFoundException(
        'Właściciel kalendarza nie został znaleziony',
      );
    }

    const existingCalendar = await this.calendarRepository.findOne({
      where: {
        name: createCalendarDto.name,
        owner: { uuid: createCalendarDto.ownerId },
      },
    });

    if (existingCalendar) {
      throw new CalendarAlreadyExistsException();
    }

    if (createCalendarDto.isDefault) {
      await this.calendarRepository.update(
        { owner: { uuid: createCalendarDto.ownerId }, isDefault: true },
        { isDefault: false },
      );
    }

    const userCalendarsCount = await this.calendarRepository.count({
      where: { owner: { uuid: createCalendarDto.ownerId } },
    });

    const calendar = await this.calendarRepository.save({
      name: createCalendarDto.name,
      owner,
      color: createCalendarDto.color || '#0066cc',
      description: createCalendarDto.description,
      isDefault: createCalendarDto.isDefault || userCalendarsCount === 0,
      active: createCalendarDto.active ?? true,
    });

    return ResponseHelper.created('Kalendarz został utworzony pomyślnie', {
      uuid: calendar.uuid,
      name: calendar.name,
    });
  }

  public async findAll(
    paginationParams: PaginationParamsDto,
    userId?: string,
  ): Promise<PaginatedResultDto<Calendar>> {
    const { page, limit, query } = paginationParams;
    const skip = (page - 1) * limit;

    const qb = this.calendarRepository
      .createQueryBuilder('calendar')
      .leftJoinAndSelect('calendar.owner', 'owner')
      .where('calendar.deleted = :deleted', { deleted: false })
      .orderBy('calendar.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    if (userId) {
      qb.andWhere('calendar.owner.uuid = :userId', { userId });
    }

    if (query) {
      qb.andWhere(
        `(
          calendar.name LIKE :query OR
          calendar.description LIKE :query OR
          owner.firstName LIKE :query OR
          owner.lastName LIKE :query
        )`,
        { query: `%${query}%` },
      );
    }

    const [calendars, total] = await qb.getManyAndCount();

    if (!calendars || calendars.length === 0) {
      return createPaginatedResponse([], 0, paginationParams);
    }

    return createPaginatedResponse(calendars, total, paginationParams);
  }

  public async findOne(uuid: string): Promise<ResponseDto> {
    const calendar = await this.calendarRepository.findOne({
      where: { uuid },
      relations: ['owner'],
    });

    if (!calendar) {
      throw new CalendarNotFoundException();
    }

    return ResponseHelper.success(
      'Kalendarz znaleziony',
      HttpStatus.OK,
      calendar,
    );
  }

  public async findByOwner(
    ownerId: string,
    paginationParams: PaginationParamsDto,
  ): Promise<PaginatedResultDto<Calendar>> {
    const { page, limit } = paginationParams;
    const skip = (page - 1) * limit;

    const [calendars, total] = await this.calendarRepository.findAndCount({
      where: {
        owner: { uuid: ownerId },
        deleted: false,
      },
      relations: ['owner'],
      order: { isDefault: 'DESC', createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return createPaginatedResponse(calendars, total, paginationParams);
  }

  public async update(
    uuid: string,
    updateCalendarDto: UpdateCalendarDto,
  ): Promise<ResponseDto> {
    const calendar = await this.calendarRepository.findOne({
      where: { uuid },
      relations: ['owner'],
    });

    if (!calendar) {
      throw new CalendarNotFoundException();
    }

    if (
      updateCalendarDto.ownerId &&
      updateCalendarDto.ownerId !== calendar.owner.uuid
    ) {
      const newOwner = await this.userRepository.findOneBy({
        uuid: updateCalendarDto.ownerId,
      });

      if (!newOwner) {
        throw new UserNotFoundException(
          'Nowy właściciel kalendarza nie został znaleziony',
        );
      }

      calendar.owner = newOwner;
    }

    if (updateCalendarDto.name && updateCalendarDto.name !== calendar.name) {
      const existingCalendar = await this.calendarRepository.findOne({
        where: {
          name: updateCalendarDto.name,
          owner: { uuid: calendar.owner.uuid },
        },
      });

      if (existingCalendar && existingCalendar.uuid !== uuid) {
        throw new CalendarAlreadyExistsException();
      }
    }

    if (updateCalendarDto.isDefault === true) {
      await this.calendarRepository.update(
        {
          owner: { uuid: calendar.owner.uuid },
          isDefault: true,
          uuid: Not(uuid), // Exclude current calendar
        },
        { isDefault: false },
      );
    }

    Object.assign(calendar, {
      name: updateCalendarDto.name ?? calendar.name,
      color: updateCalendarDto.color ?? calendar.color,
      description: updateCalendarDto.description ?? calendar.description,
      isDefault: updateCalendarDto.isDefault ?? calendar.isDefault,
      active: updateCalendarDto.active ?? calendar.active,
    });

    await this.calendarRepository.save(calendar);

    return ResponseHelper.updated('Kalendarz został zaktualizowany pomyślnie', {
      uuid: calendar.uuid,
    });
  }

  public async softDelete(uuid: string): Promise<ResponseDto> {
    const calendar = await this.calendarRepository.findOne({
      where: { uuid },
      relations: ['owner'],
    });

    if (!calendar) {
      throw new CalendarNotFoundException();
    }

    if (calendar.isDefault) {
      const otherCalendarsCount = await this.calendarRepository.count({
        where: {
          owner: { uuid: calendar.owner.uuid },
          uuid: Not(uuid),
          deleted: false,
        },
      });

      if (otherCalendarsCount > 0) {
        // Ustaw inny kalendarz jako domyślny
        const newDefaultCalendar = await this.calendarRepository.findOne({
          where: {
            owner: { uuid: calendar.owner.uuid },
            uuid: Not(uuid),
            deleted: false,
          },
          order: { createdAt: 'ASC' },
        });

        if (newDefaultCalendar) {
          newDefaultCalendar.isDefault = true;
          await this.calendarRepository.save(newDefaultCalendar);
        }
      }
    }

    calendar.deleted = true;
    calendar.active = false;
    calendar.isDefault = false;

    await this.calendarRepository.save(calendar);
    await this.calendarRepository.softDelete({ uuid });

    return ResponseHelper.softDeleted('Kalendarz został usunięty pomyślnie');
  }

  public async remove(uuid: string): Promise<ResponseDto> {
    const calendar = await this.calendarRepository.findOne({
      where: { uuid },
      withDeleted: true,
    });

    if (!calendar) {
      throw new CalendarNotFoundException();
    }

    await this.calendarRepository.remove(calendar);

    return ResponseHelper.deleted('Kalendarz został trwale usunięty');
  }

  public async restore(uuid: string): Promise<ResponseDto> {
    const calendar = await this.calendarRepository.findOne({
      where: { uuid },
      withDeleted: true,
    });

    if (!calendar) {
      throw new CalendarNotFoundException();
    }

    if (!calendar.deleted) {
      throw new CalendarIsNotDeletedException();
    }

    calendar.deleted = false;
    calendar.active = true;

    await this.calendarRepository.save(calendar);
    await this.calendarRepository.recover({ uuid });

    return ResponseHelper.restored('Kalendarz został przywrócony pomyślnie');
  }

  public async setDefaultCalendar(
    uuid: string,
    ownerId: string,
  ): Promise<ResponseDto> {
    const calendar = await this.calendarRepository.findOne({
      where: { uuid, owner: { uuid: ownerId } },
    });

    if (!calendar) {
      throw new CalendarNotFoundException(
        'Kalendarz nie należy do tego użytkownika',
      );
    }

    await this.calendarRepository.update(
      { owner: { uuid: ownerId }, isDefault: true },
      { isDefault: false },
    );

    calendar.isDefault = true;
    await this.calendarRepository.save(calendar);

    return ResponseHelper.success(
      'Kalendarz został ustawiony jako domyślny',
      HttpStatus.OK,
      { uuid: calendar.uuid },
    );
  }
}
