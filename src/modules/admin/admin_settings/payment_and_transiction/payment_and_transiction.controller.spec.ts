import { Test, TestingModule } from '@nestjs/testing';
import { PaymentAndTransactionController } from './payment_and_transiction.controller';
import { PaymentAndTransactionService } from './payment_and_transiction.service';

describe('PaymentAndTransictionController', () => {
  let controller: PaymentAndTransactionController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentAndTransactionController],
      providers: [PaymentAndTransactionService],
    }).compile();

    controller = module.get<PaymentAndTransactionController>(PaymentAndTransactionController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
