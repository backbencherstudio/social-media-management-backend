import { Module } from '@nestjs/common';
import { PaymentAndTransactionService } from './payment_and_transiction.service';
import { PaymentAndTransactionController } from './payment_and_transiction.controller';
import { PrismaService } from '../../../../prisma/prisma.service';

@Module({
  controllers: [PaymentAndTransactionController],
  providers: [PaymentAndTransactionService, PrismaService],
})
export class PaymentAndTransactionModule {}
