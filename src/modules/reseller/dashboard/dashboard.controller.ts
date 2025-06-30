import { Controller, Get, Post, Body, Patch, Param, Delete, Req, UseGuards, Query } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Reseller')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('reseller/dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) { }

  @Get('clients')
  findAllClients(@Req() req) {
    const userId = req?.user?.userId;
    return this.dashboardService.findAllClients(userId);
  }

  @Get('user/:userId/active-services')
  async getUserActiveServices(@Param('userId') userId: string) {
    return this.dashboardService.getUserActiveServices(userId);
  }

  @Get('active-services/:id')
  findOneActiveService(@Param('id') id: string) {
    return this.dashboardService.findOneActiveService(id);
  }

  @Get('analysis/:userId')
  getDashboardStats(@Param('userId') userId: string, @Req() req) {
    return this.dashboardService.getDashboardStats(userId)
  }

  @Get('clients/:userId')
  findOneClient(@Param('userId') userId: string, @Req() req) {
    // Assuming the reseller ID is on req.user.id from the JWT payload
    const resellerId = req.user.id;
    return this.dashboardService.findOneClient(resellerId, userId);
  }
}
