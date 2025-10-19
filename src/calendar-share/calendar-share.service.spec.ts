import { Test, TestingModule } from '@nestjs/testing';
import { CalendarShareService } from './calendar-share.service';

describe('CalendarShareService', () => {
  let service: CalendarShareService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CalendarShareService],
    }).compile();

    service = module.get<CalendarShareService>(CalendarShareService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
