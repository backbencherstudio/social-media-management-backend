import {
  Body,
  Controller,
  Post,
  Req,
  Get,
  Put,
  Delete,
  Param,
  Patch
} from '@nestjs/common';
import { ServiceManagementService } from './service-management.service';
import { CreateServiceDto } from './dto/create-service.dto';

@Controller('services')
export class ServiceManagementController {
  constructor(
    private readonly serviceManagementService: ServiceManagementService,
  ) {}

  @Post()
  async create(@Body() dto: CreateServiceDto, @Req() req: any) {
    const userId = req.user?.id; // adjust to your auth logic
    return await this.serviceManagementService.createService(dto, userId);
  }

  @Get('allServices')
  async getAllActiveServices() {
    return await this.serviceManagementService.getAllServices();
  }

  @Patch(':id/toggle-status')
  async toggleServiceStatus(@Param('id') id: string) {
    return await this.serviceManagementService.toggleServiceStatus(id);
  }

  @Get('inactive')
  async getInactiveServices() {
    return await this.serviceManagementService.getServicesByStatus(0); // 0 = inactive
  }

  @Get('active')
  async getActiveServices() {
    return await this.serviceManagementService.getServicesByStatus(1); // 1 = active
  }

  @Get(':id')
  async getServiceById(@Param('id') id: string) {
    return await this.serviceManagementService.getServiceById(id);
  }

  @Put(':id')
  async updateServices(@Param('id') id: string, @Body() dto: CreateServiceDto) {
    return await this.serviceManagementService.updateServices(id, dto);
  }

  @Delete(':id')
  async softDeleteService(@Param('id') id: string) {
    return await this.serviceManagementService.softDeleteService(id);
  }
}
