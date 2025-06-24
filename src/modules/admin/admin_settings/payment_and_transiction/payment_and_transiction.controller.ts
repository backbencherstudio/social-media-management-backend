import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
} from '@nestjs/common';
import { PaymentAndTransactionService } from './payment_and_transiction.service';
import { UpdateWithdrawalSettingsDto } from './dto/update-payment_and_transiction.dto';
import { Roles } from 'src/common/guard/role/roles.decorator';
import { RolesGuard } from 'src/common/guard/role/roles.guard';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { Role } from 'src/common/guard/role/role.enum';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiBearerAuth()
@ApiTags('Payment & Transaction')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN_LITE)
@Controller('admin/withdrawal-settings')
export class PaymentAndTransactionController {
  constructor(
    private readonly paymentService: PaymentAndTransactionService,
  ) {}

  @ApiOperation({ summary: 'Get withdrawal settings' })
  @Get()
  async getSettings() {
    try {
      const settings = await this.paymentService.getSettings();
      return { success: true, data: settings };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  @ApiOperation({ summary: 'Update withdrawal settings' })
  @Patch()
  async updateSettings(@Body() dto: UpdateWithdrawalSettingsDto) {
    try {
      const result = await this.paymentService.updateSettings(dto);
      return { success: true, data: result };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  @ApiOperation({ summary: 'Restore default withdrawal settings' })
  @Patch('restore')
  async restoreDefaults() {
    try {
      const result = await this.paymentService.restoreDefaults();
      return { success: true, data: result };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
}
