import { Module } from '@nestjs/common';
import { OrderPageService } from './order_page.service';
import { OrderPageController } from './order_page.controller';

@Module({
  controllers: [OrderPageController],
  providers: [OrderPageService],
})
export class OrderPageModule {}
