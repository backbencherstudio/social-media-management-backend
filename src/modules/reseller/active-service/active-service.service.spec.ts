import { Test, TestingModule } from '@nestjs/testing';
import { ActiveServiceService } from './active-service.service';

describe('ActiveServiceService', () => {
  let service: ActiveServiceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ActiveServiceService],
    }).compile();

    service = module.get<ActiveServiceService>(ActiveServiceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
