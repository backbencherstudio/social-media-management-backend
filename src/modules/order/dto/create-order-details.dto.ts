// create-order-details.dto.ts

import { IsString, IsNumber, IsOptional } from 'class-validator';

export class CreateOrderDetailDto {
  
  @IsOptional()
  @IsString()
  service_name: string;

  @IsOptional()
  @IsString()
  service_amount_name: string;
  
  @IsOptional()
  @IsNumber()
  service_count: number;

  @IsOptional()
  @IsNumber()
  service_price: number;

  @IsOptional()
  @IsString()
  service_tier_id?: string;
}
