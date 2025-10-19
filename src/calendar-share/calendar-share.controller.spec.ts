import { Test, TestingModule } from '@nestjs/testing';
import { CalendarShareController } from './calendar-share.controller';
import { CalendarShareService } from './calendar-share.service';

describe('CalendarShareController', () => {
  let controller: CalendarShareController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CalendarShareController],
      providers: [CalendarShareService],
    }).compile();

    controller = module.get<CalendarShareController>(CalendarShareController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
