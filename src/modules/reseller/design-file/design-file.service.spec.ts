import { Test, TestingModule } from '@nestjs/testing';
import { DesignFileService } from './design-file.service';

describe('DesignFileService', () => {
  let service: DesignFileService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DesignFileService],
    }).compile();

    service = module.get<DesignFileService>(DesignFileService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
