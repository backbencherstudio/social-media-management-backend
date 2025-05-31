// order_page.module.ts
import { Module } from '@nestjs/common';
import { OrderPageService } from './order_page.service';
import { OrderPageController } from './order_page.controller';

@Module({
  controllers: [OrderPageController],
  providers: [OrderPageService],
  exports: [OrderPageService], 
})
export class OrderPageModule {}
