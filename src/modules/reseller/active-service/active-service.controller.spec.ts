import { Test, TestingModule } from '@nestjs/testing';
import { ActiveServiceController } from './active-service.controller';
import { ActiveServiceService } from './active-service.service';

describe('ActiveServiceController', () => {
  let controller: ActiveServiceController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ActiveServiceController],
      providers: [ActiveServiceService],
    }).compile();

    controller = module.get<ActiveServiceController>(ActiveServiceController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
