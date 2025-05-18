import { Test, TestingModule } from '@nestjs/testing';
import { OrderPageService } from './order_page.service';

describe('OrderPageService', () => {
  let service: OrderPageService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OrderPageService],
    }).compile();

    service = module.get<OrderPageService>(OrderPageService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
