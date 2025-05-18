import { Test, TestingModule } from '@nestjs/testing';
import { OrderPageController } from './order_page.controller';
import { OrderPageService } from './order_page.service';

describe('OrderPageController', () => {
  let controller: OrderPageController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrderPageController],
      providers: [OrderPageService],
    }).compile();

    controller = module.get<OrderPageController>(OrderPageController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
