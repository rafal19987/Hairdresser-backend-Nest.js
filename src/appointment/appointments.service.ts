import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appointment } from './entities/appointment.entity';
import { Calendar } from '@/calendar/entities/calendar.entity';
import { User } from '@/users/entities/user.entity';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { ResponseDto } from '@/common/dto/response.dto';
import { ResponseHelper } from '@/common/helpers/response.helper';
import { CalendarNotFoundException } from '@/calendar/exceptions/calendar-not-found.exception';
import { UserNotFoundException } from '@/users/exceptions/user-not-found.exception';
import { AppointmentsServiceInterface } from '@/appointment/interfaces/appointments-service.interface';

@Injectable()
export class AppointmentsService implements AppointmentsServiceInterface {
  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,

    @InjectRepository(Calendar)
    private readonly calendarRepository: Repository<Calendar>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  public async create(
    createAppointmentDto: CreateAppointmentDto,
  ): Promise<ResponseDto> {
    const { ownerId, calendarId, typeId, meetingTypeId } = createAppointmentDto;

    const owner = await this.userRepository.findOneBy({ uuid: ownerId });
    if (!owner) {
      throw new UserNotFoundException(
        'Właściciel spotkania nie został znaleziony',
      );
    }

    const calendar = await this.calendarRepository.findOneBy({
      uuid: calendarId,
    });
    if (!calendar) {
      throw new CalendarNotFoundException('Kalendarz nie został znaleziony');
    }

    const appointmentType = String(typeId);
    const meetingType = meetingTypeId ? String(meetingTypeId) : null;

    const appointment = this.appointmentRepository.create({
      ...createAppointmentDto,
      type: appointmentType,
      meetingType,
      calendar,
      owner,
      createdBy: owner,
      scheduledAt: new Date(createAppointmentDto.scheduledAt),
      scheduledEndAt: new Date(createAppointmentDto.scheduledEndAt),
    });

    await this.appointmentRepository.save(appointment);

    return ResponseHelper.created('Spotkanie zostało utworzone', {
      uuid: appointment.uuid,
      name: appointment.name,
      scheduledAt: appointment.scheduledAt,
      scheduledEndAt: appointment.scheduledEndAt,
    });
  }
}
