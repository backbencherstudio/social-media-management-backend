import { Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
import { ServiceService } from './service.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

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
    return await this.serviceService.getServicesByUserId(userId);
  }


  // Get a single service by ID (for users)
  @Get(':id')
  async getServiceById(@Param('id') id: string, @Req() req: any) {
    const userId = req.user?.userId;
    return await this.serviceService.getServiceById(id, userId);
  }
}
