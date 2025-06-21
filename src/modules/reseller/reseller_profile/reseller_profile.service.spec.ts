import { Test, TestingModule } from '@nestjs/testing';
import { ResellerProfileService } from './reseller_profile.service';

describe('ResellerProfileService', () => {
  let service: ResellerProfileService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ResellerProfileService],
    }).compile();

    service = module.get<ResellerProfileService>(ResellerProfileService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
