import { Test, TestingModule } from '@nestjs/testing';
import { ClintsController } from './clints.controller';
import { ClintsService } from './clints.service';

describe('ClintsController', () => {
  let controller: ClintsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClintsController],
      providers: [ClintsService],
    }).compile();

    controller = module.get<ClintsController>(ClintsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
