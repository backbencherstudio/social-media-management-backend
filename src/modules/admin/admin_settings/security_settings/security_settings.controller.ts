import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { SecuritySettingsService } from './security_settings.service';
import { UpdateSecuritySettingsDto } from './dto/update-security_setting.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guard/role/roles.guard';
import { Roles } from 'src/common/guard/role/roles.decorator';
import { Role } from 'src/common/guard/role/role.enum';

@ApiBearerAuth()
@ApiTags('Website Info')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN_LITE)
@Controller('admin/security-settings')
export class SecuritySettingsController {
  constructor(private readonly service: SecuritySettingsService) {}

  @Get('all')
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
