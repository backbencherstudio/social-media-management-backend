import { Controller, Get, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '../../../common/guard/role/role.enum';
import { Roles } from '../../../common/guard/role/roles.decorator';
import { RolesGuard } from '../../../common/guard/role/roles.guard';
import { JwtAuthGuard } from '../../../modules/auth/guards/jwt-auth.guard';
import { Request } from 'express';
import { PrismaService } from '../../../prisma/prisma.service';

@ApiBearerAuth()
@ApiTags('Notification')
@UseGuards(JwtAuthGuard)
@Controller('notification')
export class NotificationController {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly prisma: PrismaService
  ) { }

  @ApiOperation({ summary: 'Get all notifications' })
  @Get()
  async findAll(@Req() req: Request) {
    const user_id = req.user.userId;

    return await this.notificationService.findAll(user_id);
  }

  @Get('all')
  async getAllNotifications(@Req() req: Request) {
    try {


      const notifications = await this.notificationService.getAllNotifications();
      return notifications;
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @Get('reseller')
  async getResellerNotifications(@Req() req: Request) {
    const user_id = req.user.userId;
    const reseller = await this.prisma.reseller.findFirst({ where: { user_id } });
    if (!reseller) {
      return { success: false, message: 'Not a reseller' };
    }
    return await this.notificationService.findAll(user_id);
  }

  @ApiOperation({ summary: 'Delete notification' })
  @Delete(':id')
  async remove(@Req() req: Request, @Param('id') id: string) {
    try {
      const user_id = req.user.userId;
      const notification = await this.notificationService.remove(id, user_id);

      return notification;
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @ApiOperation({ summary: 'Delete all notifications' })
  @Delete()
  async removeAll(@Req() req: Request) {
    try {
      const user_id = req.user.userId;
      const notification = await this.notificationService.removeAll(user_id);

      return notification;
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }
}
