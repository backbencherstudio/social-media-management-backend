import { IsOptional, IsString, IsEmail } from 'class-validator';

export class UpdateWebsiteInfoDto {
  @IsOptional()
  @IsString()
  site_name?: string;

  @IsOptional()
  @IsString()
  site_description?: string;

  @IsOptional()
  @IsString()
  time_zone?: string;

  @IsOptional()
  @IsString()
  phone_number?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  logo?: string;

  @IsOptional()
  @IsString()
  favicon?: string;

  @IsOptional()
  @IsString()
  copyright?: string;

  @IsOptional()
  @IsString()
  cancellation_policy?: string;
}
