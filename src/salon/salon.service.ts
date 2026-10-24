import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ResponseDto } from '@/common/dto/response.dto';
import { ResponseHelper } from '@/common/helpers/response.helper';
import { SalonServiceInterface } from '@/salon/interfaces/salon-service.interface';
import { Salon } from '@/salon/entities/salon.entity';
import { SalonOpeningHours } from '@/salon/entities/salon-opening-hours.entity';
import { SalonSpecialDay } from '@/salon/entities/salon-special-day.entity';
import { SalonSpecialDayHours } from '@/salon/entities/salon-special-day-hours.entity';
import { UpdateSalonDto } from '@/salon/dto/update-salon.dto';
import { ReplaceOpeningHoursDto } from '@/salon/dto/replace-opening-hours.dto';
import { SaveSpecialDayDto } from '@/salon/dto/save-special-day.dto';
import { SpecialDaysQueryDto } from '@/salon/dto/special-days-query.dto';
import { SalonNotFoundException } from '@/salon/exceptions/salon-not-found.exception';
import { SalonInvalidHoursException } from '@/salon/exceptions/salon-invalid-hours.exception';
import { SalonSpecialDayNotFoundException } from '@/salon/exceptions/salon-special-day-not-found.exception';
import { SalonSpecialDayAlreadyExistsException } from '@/salon/exceptions/salon-special-day-already-exists.exception';
import {
  toOpeningHoursResponse,
  toSalonResponse,
  toSpecialDayResponse,
} from '@/salon/mappers/salon-response.mapper';
import { findDefaultSalon } from '@/salon/helpers/default-salon.helper';
import {
  findTimeRangeError,
  formatLocalDate,
  isoDayOfWeek,
  sortTimeRanges,
  TimeRange,
} from '@/salon/helpers/time.helper';

const DAY_NAMES = [
  'poniedziałek',
  'wtorek',
  'środa',
  'czwartek',
  'piątek',
  'sobota',
  'niedziela',
];

@Injectable()
export class SalonService implements SalonServiceInterface {
  constructor(
    @InjectRepository(Salon)
    private readonly salonRepository: Repository<Salon>,
    @InjectRepository(SalonOpeningHours)
    private readonly openingHoursRepository: Repository<SalonOpeningHours>,
    @InjectRepository(SalonSpecialDay)
    private readonly specialDayRepository: Repository<SalonSpecialDay>,
    private readonly dataSource: DataSource,
  ) {}

  public async getSalon(): Promise<ResponseDto> {
    const salon = await this._getSalon();

    return ResponseHelper.success(
      'Salon found',
      HttpStatus.OK,
      await this._toSalonResponse(salon),
    );
  }

  public async update(updateSalonDto: UpdateSalonDto): Promise<ResponseDto> {
    const salon = await this._getSalon();

    const changes = Object.fromEntries(
      Object.entries(updateSalonDto).filter(([, value]) => value !== undefined),
    );
    const saved = await this.salonRepository.save({ ...salon, ...changes });

    return ResponseHelper.updated(
      'Salon updated',
      await this._toSalonResponse(saved),
    );
  }

  public async replaceOpeningHours(
    replaceOpeningHoursDto: ReplaceOpeningHoursDto,
  ): Promise<ResponseDto> {
    const salon = await this._getSalon();
    const { hours } = replaceOpeningHoursDto;

    for (let dayOfWeek = 1; dayOfWeek <= 7; dayOfWeek++) {
      const error = findTimeRangeError(
        hours.filter(entry => entry.dayOfWeek === dayOfWeek),
      );
      if (error) {
        throw new SalonInvalidHoursException(
          `${DAY_NAMES[dayOfWeek - 1]}: ${error}`,
        );
      }
    }

    const saved = await this.dataSource.transaction(async manager => {
      const repository = manager.getRepository(SalonOpeningHours);
      await repository.delete({ salon: { uuid: salon.uuid } });
      return repository.save(
        hours.map(entry => repository.create({ ...entry, salon })),
      );
    });

    return ResponseHelper.updated(
      'Opening hours updated',
      toOpeningHoursResponse(saved),
    );
  }

  public async findSpecialDays(
    query: SpecialDaysQueryDto,
  ): Promise<ResponseDto> {
    const salon = await this._getSalon();
    const specialDays = await this._findSpecialDays(salon, query);

    return ResponseHelper.success(
      'Special days found',
      HttpStatus.OK,
      specialDays.map(toSpecialDayResponse),
    );
  }

  public async createSpecialDay(
    saveSpecialDayDto: SaveSpecialDayDto,
  ): Promise<ResponseDto> {
    const salon = await this._getSalon();
    this._assertValidSpecialDay(saveSpecialDayDto);
    await this._assertDateAvailable(salon, saveSpecialDayDto.date);

    const specialDay = await this.specialDayRepository.save(
      this.specialDayRepository.create({
        salon,
        ...this._toSpecialDayFields(saveSpecialDayDto),
      }),
    );

    return ResponseHelper.created(
      'Special day created',
      toSpecialDayResponse(specialDay),
    );
  }

  public async updateSpecialDay(
    uuid: string,
    saveSpecialDayDto: SaveSpecialDayDto,
  ): Promise<ResponseDto> {
    const salon = await this._getSalon();
    const specialDay = await this._findSpecialDay(salon, uuid);
    this._assertValidSpecialDay(saveSpecialDayDto);

    if (specialDay.date !== saveSpecialDayDto.date) {
      await this._assertDateAvailable(salon, saveSpecialDayDto.date);
    }

    const saved = await this.specialDayRepository.save(
      Object.assign(specialDay, this._toSpecialDayFields(saveSpecialDayDto)),
    );

    return ResponseHelper.updated(
      'Special day updated',
      toSpecialDayResponse(saved),
    );
  }

  public async removeSpecialDay(uuid: string): Promise<ResponseDto> {
    const salon = await this._getSalon();
    const specialDay = await this._findSpecialDay(salon, uuid);

    await this.specialDayRepository.remove(specialDay);

    return ResponseHelper.deleted('Special day deleted');
  }

  public getBookingSettings(): Promise<Salon> {
    return this._getSalon();
  }

  // Special day overrides the weekly schedule; date is in the salon time zone
  public async findOpeningRanges(
    salon: Salon,
    date: string,
  ): Promise<TimeRange[]> {
    const specialDay = await this.specialDayRepository.findOne({
      where: { date, salon: { uuid: salon.uuid } },
      relations: { hours: true },
    });

    const ranges: TimeRange[] = specialDay
      ? specialDay.hours
      : await this.openingHoursRepository.find({
          where: { salon: { uuid: salon.uuid }, dayOfWeek: isoDayOfWeek(date) },
        });

    return sortTimeRanges(ranges).map(({ opensAt, closesAt }) => ({
      opensAt,
      closesAt,
    }));
  }

  private async _getSalon(): Promise<Salon> {
    const salon = await findDefaultSalon(this.salonRepository);

    if (!salon) throw new SalonNotFoundException();

    return salon;
  }

  private async _toSalonResponse(salon: Salon) {
    const [openingHours, specialDays] = await Promise.all([
      this.openingHoursRepository.find({
        where: { salon: { uuid: salon.uuid } },
      }),
      this._findSpecialDays(salon, {}),
    ]);

    return toSalonResponse(salon, openingHours, specialDays);
  }

  private _findSpecialDays(
    salon: Salon,
    query: SpecialDaysQueryDto,
  ): Promise<SalonSpecialDay[]> {
    const from =
      query.from ?? formatLocalDate(new Date(Date.now()), salon.timeZone);

    if (query.to && query.to < from) {
      throw new SalonInvalidHoursException(
        'Data "to" nie może być wcześniejsza niż "from"',
      );
    }

    const qb = this.specialDayRepository
      .createQueryBuilder('specialDay')
      .leftJoinAndSelect('specialDay.hours', 'hours')
      .where('specialDay.salon = :salonUuid', { salonUuid: salon.uuid })
      .andWhere('specialDay.date >= :from', { from })
      .orderBy('specialDay.date', 'ASC');

    if (query.to) qb.andWhere('specialDay.date <= :to', { to: query.to });

    return qb.getMany();
  }

  private async _findSpecialDay(
    salon: Salon,
    uuid: string,
  ): Promise<SalonSpecialDay> {
    const specialDay = await this.specialDayRepository.findOne({
      where: { uuid, salon: { uuid: salon.uuid } },
      relations: { hours: true },
    });

    if (!specialDay) throw new SalonSpecialDayNotFoundException();

    return specialDay;
  }

  private async _assertDateAvailable(salon: Salon, date: string) {
    const exists = await this.specialDayRepository.exists({
      where: { date, salon: { uuid: salon.uuid } },
    });

    if (exists) throw new SalonSpecialDayAlreadyExistsException();
  }

  private _assertValidSpecialDay({ isClosed, hours = [] }: SaveSpecialDayDto) {
    if (isClosed && hours.length > 0) {
      throw new SalonInvalidHoursException(
        'Zamknięty dzień nie może mieć godzin otwarcia',
      );
    }

    if (!isClosed && hours.length === 0) {
      throw new SalonInvalidHoursException(
        'Podaj godziny otwarcia lub oznacz dzień jako zamknięty',
      );
    }

    const error = findTimeRangeError(hours);
    if (error) throw new SalonInvalidHoursException(error);
  }

  private _toSpecialDayFields({
    date,
    name,
    isClosed,
    hours = [],
  }: SaveSpecialDayDto) {
    return {
      date,
      name: name ?? null,
      isClosed,
      hours: hours.map(
        ({ opensAt, closesAt }) =>
          ({ opensAt, closesAt }) as SalonSpecialDayHours,
      ),
    };
  }
}
