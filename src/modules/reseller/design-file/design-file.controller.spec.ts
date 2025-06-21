import { Test, TestingModule } from '@nestjs/testing';
import { DesignFileController } from './design-file.controller';

describe('DesignFileController', () => {
  let controller: DesignFileController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DesignFileController],
    }).compile();

    controller = module.get<DesignFileController>(DesignFileController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
