import { Test, TestingModule } from '@nestjs/testing';
import { AppointmentsController } from './appointments.controller';
import { APPOINTMENTS_SERVICE } from '@/appointment/interfaces/appointments-service.interface';
import { AuthenticationGuard } from '@/guards/authentication.guard';
import { AuthorizationGuard } from '@/guards/authorization.guard';
import { AppointmentStatus } from '@/appointment/enums/appointment-status.enum';

describe('AppointmentsController', () => {
  let controller: AppointmentsController;

  const appointmentsService = {
    find: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppointmentsController],
      providers: [
        { provide: APPOINTMENTS_SERVICE, useValue: appointmentsService },
      ],
    })
      .overrideGuard(AuthenticationGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(AuthorizationGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AppointmentsController>(AppointmentsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('delegates find to service', async () => {
    appointmentsService.find.mockResolvedValue({ statusCode: 200 });

    await controller.find('appointment-uuid');

    expect(appointmentsService.find).toHaveBeenCalledWith('appointment-uuid');
  });

  it('delegates update to service', async () => {
    const dto = { status: AppointmentStatus.CONFIRMED };

    await controller.update('appointment-uuid', dto);

    expect(appointmentsService.update).toHaveBeenCalledWith(
      'appointment-uuid',
      dto,
    );
  });
});
