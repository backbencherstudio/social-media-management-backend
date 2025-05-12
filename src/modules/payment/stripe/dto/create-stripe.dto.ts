import { IsNumber, IsString, IsOptional } from 'class-validator';

export class CreateStripeDto {
  @IsString()
  clientId: string;

  @IsString()
  adminId: string;

  @IsNumber()
  amount: number; // in cents (e.g., 9900 = $99.00)

  @IsString()
  currency: string;

  @IsOptional()
  @IsString()
  packageName?: string;

  @IsOptional()
  @IsString()
  packageType?: string;
}
