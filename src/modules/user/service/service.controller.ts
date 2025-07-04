import { Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
import { ServiceService } from './service.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('service')
export class ServiceController {
  constructor(private readonly serviceService: ServiceService) { }

  @UseGuards(JwtAuthGuard)

  // Get all services (for users)
  @Get()
  async getAllServices() {
    return await this.serviceService.getAllServices();
  }

  @Get('user/my-services')
  async getMyServices(@Req() req: any) {
    const userId = req.user?.userId;
    return await this.serviceService.getPurchasedServicesByUserId(userId);
  }

  @Get('user/:id')
  async getServiceById(@Req() req: any, @Param('id') id: string) {
    const userId = req.user?.userId;
    return await this.serviceService.getServiceById(id, userId);
  }
}
