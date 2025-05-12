import { Injectable, BadRequestException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { UpdateSecuritySettingsDto } from './dto/update-security_setting.dto';

@Injectable()
export class SecuritySettingsService {
  constructor(private readonly prisma: PrismaService) {}

  // Constants defined directly in the service
private readonly DEFAULT_SETTINGS = {
  data_export_backup: 7,
  session_timeout: 30,
  failed_login_attempts: 5,
  password_expiry: 90,
};

private readonly SecuritySettingsOptions = {
  data_export_backup: [7, 10, 15, 25, 30, 45, 50, 55, 60],
  session_timeout: [15, 30, 45, 60],
  failed_login_attempts: [3, 5, 7, 10],
  password_expiry: [30, 60, 90, 120, 180],
};


// GET: Get current security settings
async get() {
  try {
    let settings = await this.prisma.securitySettings.findUnique({
      where: { id: "1" },
    });

    if (!settings) {
      settings = await this.prisma.securitySettings.create({
        data: {
          ...this.DEFAULT_SETTINGS,
        },
      });
    }

    return settings;
  } catch (error) {
    throw new InternalServerErrorException(
      error.message || 'Failed to retrieve security settings.',
    );
  }
}

// PATCH: Update security settings
async update(data: UpdateSecuritySettingsDto) {
  try {
    const {
      dataExportBackup,
      sessionTimeout,
      failedLoginAttempts,
      passwordExpiry,
    } = data;

    if (!this.SecuritySettingsOptions.data_export_backup.includes(dataExportBackup)) {
      throw new BadRequestException('Invalid dataExportBackup');
    }
    if (!this.SecuritySettingsOptions.session_timeout.includes(sessionTimeout)) {
      throw new BadRequestException('Invalid sessionTimeout');
    }
    if (!this.SecuritySettingsOptions.failed_login_attempts.includes(failedLoginAttempts)) {
      throw new BadRequestException('Invalid failedLoginAttempts');
    }
    if (!this.SecuritySettingsOptions.password_expiry.includes(passwordExpiry)) {
      throw new BadRequestException('Invalid passwordExpiry');
    }

    const updated = await this.prisma.securitySettings.update({
      where: { id: "1" },
      data,
    });

    return updated;
  } catch (error) {
    throw new InternalServerErrorException(
      error.message || 'Failed to update security settings.',
    );
  }
}
  
// PATCH: Reset to default (seeded) settings
async reset() {
  try {
    const existing = await this.prisma.securitySettings.findUnique({
      where: { id: "1" },
    });

    if (!existing) {
      throw new NotFoundException('Security settings record not found.');
    }

    const restored = await this.prisma.securitySettings.update({
      where: { id: "1" },
      data: this.DEFAULT_SETTINGS,
    });

    return restored;
  } catch (error) {
    throw new InternalServerErrorException(
      error.message || 'Failed to reset security settings.',
    );
  }
}
}
