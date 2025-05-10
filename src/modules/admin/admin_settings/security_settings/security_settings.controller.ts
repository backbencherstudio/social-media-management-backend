import { Controller, Get, Patch, Body } from '@nestjs/common';
import { SecuritySettingsService } from './security_settings.service';
import { UpdateSecuritySettingsDto } from './dto/update-security_setting.dto';

@Controller('admin/security-settings')
export class SecuritySettingsController {
  constructor(private readonly service: SecuritySettingsService) {}

  @Get()
  async getSettings() {
    try {
      const response = await this.service.get();
      return {
        success: true,
        message: 'Settings retrieved successfully.',
        data: response,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to retrieve settings.',
      };
    }
  }

  @Patch('/update')
  async updateSettings(@Body() body: UpdateSecuritySettingsDto) {
    try {
      const response = await this.service.update(body);
      return {
        success: true,
        message: 'Settings updated successfully.',
        data: response,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to update settings.',
      };
    }
  }

  @Patch('/restore')
  async resetSettings() {
    try {
      const response = await this.service.reset();
      return {
        success: true,
        message: 'Settings restored to defaults.',
        data: response,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to restore settings.',
      };
    }
  }
}
