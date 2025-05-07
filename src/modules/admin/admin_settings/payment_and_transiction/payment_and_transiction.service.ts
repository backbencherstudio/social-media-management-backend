import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import {UpdateWithdrawalSettingsDto } from './dto/update-payment_and_transiction.dto';

@Injectable()
export class PaymentAndTransactionService {
  constructor(private prisma: PrismaService) {}

  async getSettings() {
    try {
      const existing = await this.prisma.withdrawalSettings.findFirst();

      if (!existing) {
        return {
          success: false,
          message: 'No settings found.',
        };
      }

      return {
        success: true,
        message: 'Settings retrieved successfully.',
        data: existing,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to fetch settings.',
      };
    }
  }

  async updateSettings(dto: UpdateWithdrawalSettingsDto) {
    try {
      const existing = await this.prisma.withdrawalSettings.findFirst();

      if (!existing) {
        throw new NotFoundException('Withdrawal settings not found.');
      }

      const updated = await this.prisma.withdrawalSettings.update({
        where: { id: existing.id },
        data: { ...dto },
      });

      return {
        success: true,
        message: 'Settings updated successfully.',
        data: updated,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to update settings.',
      };
    }
  }

  async restoreDefaults() {
    try {
      const existing = await this.prisma.withdrawalSettings.findFirst();

      if (!existing) {
        throw new NotFoundException('Withdrawal settings not found.');
      }

      const restored = await this.prisma.withdrawalSettings.update({
        where: { id: existing.id },
        data: {
          minimumWithdrawalAmount: 100,
          withdrawalProcessingFee: 1,
          withdrawalProcessingTime: '3-5 Business Days',
          isFlatCommission: false,
          flatCommissionValue: null,
          percentageCommissionValue: 10,
          paymentMethods: ['PayPal', 'Visa/MasterCard', 'Bank Transfer'],
        },
      });

      return {
        success: true,
        message: 'Settings restored to default values.',
        data: restored,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to restore default settings.',
      };
    }
  }
}
