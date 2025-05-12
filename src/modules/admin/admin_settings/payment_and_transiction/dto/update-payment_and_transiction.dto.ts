import { IsOptional, IsBoolean, IsNumber, IsString, IsArray } from 'class-validator';

export class UpdateWithdrawalSettingsDto {
  @IsOptional()
  @IsNumber()
  minimum_withdrawal_amount?: number;

  @IsOptional()
  @IsNumber()
  withdrawal_processing_fee?: number;

  @IsOptional()
  @IsString()
  withdrawal_processing_time?: string;

  @IsOptional()
  @IsBoolean()
  is_flat_commission?: boolean;

  @IsOptional()
  @IsNumber()
  flat_commission_value?: number;

  @IsOptional()
  @IsNumber()
  percentage_commission_value?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  payment_methods?: string[];
}
