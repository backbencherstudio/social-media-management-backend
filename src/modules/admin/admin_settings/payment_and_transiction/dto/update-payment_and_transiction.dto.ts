import { IsOptional, IsBoolean, IsNumber, IsString, IsArray } from 'class-validator';

export class UpdateWithdrawalSettingsDto {
  @IsOptional()
  @IsNumber()
  minimumWithdrawalAmount?: number;

  @IsOptional()
  @IsNumber()
  withdrawalProcessingFee?: number;

  @IsOptional()
  @IsString()
  withdrawalProcessingTime?: string;

  @IsOptional()
  @IsBoolean()
  isFlatCommission?: boolean;

  @IsOptional()
  @IsNumber()
  flatCommissionValue?: number;

  @IsOptional()
  @IsNumber()
  percentageCommissionValue?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  paymentMethods?: string[];
}
