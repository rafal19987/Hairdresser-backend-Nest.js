import { ResponseDto } from '@/common/dto/response.dto';
import { UpdateSalonDto } from '@/salon/dto/update-salon.dto';
import { ReplaceOpeningHoursDto } from '@/salon/dto/replace-opening-hours.dto';
import { SaveSpecialDayDto } from '@/salon/dto/save-special-day.dto';
import { SpecialDaysQueryDto } from '@/salon/dto/special-days-query.dto';

export interface SalonServiceInterface {
  getSalon(): Promise<ResponseDto>;
  update(updateSalonDto: UpdateSalonDto): Promise<ResponseDto>;
  replaceOpeningHours(
    replaceOpeningHoursDto: ReplaceOpeningHoursDto,
  ): Promise<ResponseDto>;
  findSpecialDays(query: SpecialDaysQueryDto): Promise<ResponseDto>;
  createSpecialDay(saveSpecialDayDto: SaveSpecialDayDto): Promise<ResponseDto>;
  updateSpecialDay(
    uuid: string,
    saveSpecialDayDto: SaveSpecialDayDto,
  ): Promise<ResponseDto>;
  removeSpecialDay(uuid: string): Promise<ResponseDto>;
}

export const SALON_SERVICE = 'SALON_SERVICE';
