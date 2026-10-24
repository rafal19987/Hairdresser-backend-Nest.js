import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ResponseDto } from '@/common/dto/response.dto';
import { AuthenticationGuard } from '@/guards/authentication.guard';
import { AuthorizationGuard } from '@/guards/authorization.guard';
import { Permissions } from '@/decorators/permissions.decorator';
import { Action } from '@/roles/enums/action.enum';
import { Resource } from '@/roles/enums/resource.enum';
import {
  SALON_SERVICE,
  SalonServiceInterface,
} from '@/salon/interfaces/salon-service.interface';
import { UpdateSalonDto } from '@/salon/dto/update-salon.dto';
import { ReplaceOpeningHoursDto } from '@/salon/dto/replace-opening-hours.dto';
import { SaveSpecialDayDto } from '@/salon/dto/save-special-day.dto';
import { SpecialDaysQueryDto } from '@/salon/dto/special-days-query.dto';
import {
  ApiCreateSpecialDay,
  ApiDeleteSpecialDay,
  ApiFindSpecialDays,
  ApiGetSalon,
  ApiReplaceOpeningHours,
  ApiUpdateSalon,
  ApiUpdateSpecialDay,
} from '@/salon/decorators/salon-swagger.decorator';

@ApiTags('Salon')
@Controller('salon')
export class SalonController {
  constructor(
    @Inject(SALON_SERVICE)
    private readonly salonService: SalonServiceInterface,
  ) {}

  @ApiGetSalon()
  @Get()
  async getSalon(): Promise<ResponseDto> {
    return await this.salonService.getSalon();
  }

  @ApiUpdateSalon()
  @UseGuards(AuthenticationGuard, AuthorizationGuard)
  @Permissions([{ resource: Resource.SETTINGS, actions: [Action.WRITE] }])
  @Put()
  async update(@Body() updateSalonDto: UpdateSalonDto): Promise<ResponseDto> {
    return await this.salonService.update(updateSalonDto);
  }

  @ApiReplaceOpeningHours()
  @UseGuards(AuthenticationGuard, AuthorizationGuard)
  @Permissions([{ resource: Resource.SETTINGS, actions: [Action.WRITE] }])
  @Put('opening-hours')
  async replaceOpeningHours(
    @Body() replaceOpeningHoursDto: ReplaceOpeningHoursDto,
  ): Promise<ResponseDto> {
    return await this.salonService.replaceOpeningHours(replaceOpeningHoursDto);
  }

  @ApiFindSpecialDays()
  @Get('special-days')
  async findSpecialDays(
    @Query() query: SpecialDaysQueryDto,
  ): Promise<ResponseDto> {
    return await this.salonService.findSpecialDays(query);
  }

  @ApiCreateSpecialDay()
  @UseGuards(AuthenticationGuard, AuthorizationGuard)
  @Permissions([{ resource: Resource.SETTINGS, actions: [Action.CREATE] }])
  @Post('special-days')
  async createSpecialDay(
    @Body() saveSpecialDayDto: SaveSpecialDayDto,
  ): Promise<ResponseDto> {
    return await this.salonService.createSpecialDay(saveSpecialDayDto);
  }

  @ApiUpdateSpecialDay()
  @UseGuards(AuthenticationGuard, AuthorizationGuard)
  @Permissions([{ resource: Resource.SETTINGS, actions: [Action.WRITE] }])
  @Put('special-days/:uuid')
  async updateSpecialDay(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Body() saveSpecialDayDto: SaveSpecialDayDto,
  ): Promise<ResponseDto> {
    return await this.salonService.updateSpecialDay(uuid, saveSpecialDayDto);
  }

  @ApiDeleteSpecialDay()
  @UseGuards(AuthenticationGuard, AuthorizationGuard)
  @Permissions([{ resource: Resource.SETTINGS, actions: [Action.DELETE] }])
  @Delete('special-days/:uuid')
  async removeSpecialDay(
    @Param('uuid', ParseUUIDPipe) uuid: string,
  ): Promise<ResponseDto> {
    return await this.salonService.removeSpecialDay(uuid);
  }
}
