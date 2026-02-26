import { Test, TestingModule } from '@nestjs/testing';
import { UsersServicesService } from './users-services.service';

describe('UsersServicesService', () => {
  let service: UsersServicesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UsersServicesService],
    }).compile();

    service = module.get<UsersServicesService>(UsersServicesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
