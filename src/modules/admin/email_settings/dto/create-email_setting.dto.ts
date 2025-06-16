import { IsString, IsInt, IsNotEmpty, IsEmail } from 'class-validator';

export class CreateEmailSettingsDto {
  @IsString()
  @IsNotEmpty()
  smtpHost: string;

  @IsInt()
  smtpPort: number;

  @IsString()
  @IsNotEmpty()
  smtpUsername: string;

  @IsString()
  @IsNotEmpty()
  smtpPassword: string;

  @IsString()
  @IsNotEmpty()
  smtpFrom: string;
}
