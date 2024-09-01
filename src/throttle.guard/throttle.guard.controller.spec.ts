import { Test, TestingModule } from '@nestjs/testing';
import { ThrottleGuardController } from './throttle.guard.controller';

describe('ThrottleGuardController', () => {
  let controller: ThrottleGuardController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ThrottleGuardController],
    }).compile();

    controller = module.get<ThrottleGuardController>(ThrottleGuardController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
