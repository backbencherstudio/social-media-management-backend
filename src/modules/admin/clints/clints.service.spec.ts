import { Test, TestingModule } from '@nestjs/testing';
import { ClintsService } from './clints.service';

describe('ClintsService', () => {
  let service: ClintsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ClintsService],
    }).compile();

    service = module.get<ClintsService>(ClintsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
