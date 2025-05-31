// invoice.module.ts
import { Module } from '@nestjs/common';
import { InvoiceService } from './invoice.service';
import { InvoiceController } from './invoice.controller';
import { OrderPageModule } from './../../order_page/order_page.module'; 

@Module({
  imports: [OrderPageModule],
  providers: [InvoiceService],
  controllers: [InvoiceController],
})
export class InvoiceModule {}
