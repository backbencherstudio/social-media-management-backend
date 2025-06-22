import { IsNumber, IsOptional, IsPositive } from "class-validator";

export class WithdrawPaymentDto {
    @IsNumber()
  @IsPositive()
  amount: number;
  
    @IsOptional()
  method: string;
}
