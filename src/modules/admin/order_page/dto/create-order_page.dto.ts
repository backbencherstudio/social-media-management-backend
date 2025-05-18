export class CreateOrderPageDto {}

import { IsEnum } from 'class-validator';
import { OrderType } from '@prisma/client'; 

export class UpdateOrderDto {
  @IsEnum(OrderType)
  order_type: OrderType; 
}
