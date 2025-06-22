import { Test, TestingModule } from '@nestjs/testing';
import { ResellerProfileController } from './reseller_profile.controller';
import { ResellerProfileService } from './reseller_profile.service';

describe('ResellerProfileController', () => {
  let controller: ResellerProfileController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ResellerProfileController],
      providers: [ResellerProfileService],
    }).compile();

    controller = module.get<ResellerProfileController>(ResellerProfileController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
