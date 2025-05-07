import { Test, TestingModule } from '@nestjs/testing';
import { PaymentAndTransactionService } from './payment_and_transiction.service';

describe('PaymentAndTransictionService', () => {
  let service: PaymentAndTransactionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PaymentAndTransactionService],
    }).compile();

    service = module.get<PaymentAndTransactionService>(PaymentAndTransactionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
