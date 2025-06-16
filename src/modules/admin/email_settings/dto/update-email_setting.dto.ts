import { IsString, IsInt, IsOptional } from 'class-validator';

export class UpdateEmailSettingsDto {
  @IsString()
  @IsOptional()
  smtpHost?: string;

  @IsInt()
  @IsOptional()
  smtpPort?: number;

  @IsString()
  @IsOptional()
  smtpUsername?: string;

  @IsString()
  @IsOptional()
  smtpPassword?: string;

  @IsString()
  @IsOptional()
  smtpFrom?: string;
}
