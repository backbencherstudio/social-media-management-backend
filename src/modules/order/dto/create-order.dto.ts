// create-order.dto.ts

import { IsArray, IsNotEmpty, IsString, IsNumber, IsOptional } from 'class-validator';
import { CreateOrderDetailDto } from './create-order-details.dto';

export class CreateOrderDto {

  @IsOptional()
  @IsNumber()
  ammount: number;
  
  @IsOptional()
  @IsString()
  user_id: string;

  @IsOptional()
  @IsString()
  service_id: string;
  
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  pakage_name: string;

  @IsArray()
  @IsNotEmpty()
  order_items: CreateOrderDetailDto[];

    @IsOptional()
  metadata?: Record<string, string>;
  static service_id: string;
  static user_id: string;
}
