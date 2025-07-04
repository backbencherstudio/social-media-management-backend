import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { GetUser } from 'src/modules/auth/decorators/get-user.decorator';

@Controller('user/dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) { }

  @Get('active-services')
  @UseGuards(JwtAuthGuard)
  async getActiveServices(@Req() req) {
    const userId = req?.user?.userId
    return this.dashboardService.getActiveServices(userId);
  }

  @Get('all-services')
  @UseGuards(JwtAuthGuard)
  async getAllServices(@Req() req) {
    const userId = req?.user?.userId
    return this.dashboardService.getAllServices(userId);
  }

  @Get('recent-activity')
  @UseGuards(JwtAuthGuard)
  async getRecentActivity(@Req() req) {
    const userId = req?.user?.userId
    return this.dashboardService.getRecentActivity(userId);
  }

  @Get('services-we-offer')
  async getOfferedServices() {
    return this.dashboardService.getOfferedServices();
  }
}
