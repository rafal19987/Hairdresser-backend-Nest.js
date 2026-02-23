import { Test, TestingModule } from '@nestjs/testing';
import { UsersServicesController } from './users-services.controller';

describe('UsersServicesController', () => {
  let controller: UsersServicesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersServicesController],
    }).compile();

    controller = module.get<UsersServicesController>(UsersServicesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
