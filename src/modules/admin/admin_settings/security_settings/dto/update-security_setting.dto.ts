import { IsInt } from 'class-validator';

export class UpdateSecuritySettingsDto {
  @IsInt()
  dataExportBackup: number;

  @IsInt()
  sessionTimeout: number;

  @IsInt()
  failedLoginAttempts: number;

  @IsInt()
  passwordExpiry: number;
}
