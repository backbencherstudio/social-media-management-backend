export class CreateOrderPageDto {}

import { IsEnum, IsString } from 'class-validator';
import { OrderStatus } from '@prisma/client'; 

export class UpdateOrderDto {
  @IsEnum(OrderStatus)
  order_type: OrderStatus; 
}




