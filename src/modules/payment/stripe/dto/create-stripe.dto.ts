import { IsNumber, IsString, Min, IsOptional, IsDateString, IsInt, IsEnum, IsBoolean } from 'class-validator';

export class CreatePaymentIntentDto {
  @IsNumber()
  amount: number;

  @IsString()
  currency: string;

  @IsString()
  customer_id: string;

    @IsString()
  user_id: string;

  @IsString()
  service_tier_id: string;

  @IsString()
  service_id: string;

  @IsString()
  status: string;


  @IsOptional()
  metadata?: Record<string, string>;
}

