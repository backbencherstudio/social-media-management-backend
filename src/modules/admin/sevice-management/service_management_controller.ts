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

  @Post() // create service route
  async create(@Body() dto: CreateServiceDto, @Req() req: any) {
    const user_id = req.user?.id; 
    return await this.serviceManagementService.createService(dto, user_id);
  }

  @Get('allServices')  // Get all services route
  async getAllActiveServices() {
    return await this.serviceManagementService.getAllServices();
  }

  @Patch(':id/toggle-status') // Status active/deactive
  async toggleServiceStatus(@Param('id') id: string) {
    return await this.serviceManagementService.toggleServiceStatus(id);
  }

  @Get('inactive') // get all inactive services 
  async getInactiveServices() {
    return await this.serviceManagementService.getServicesByStatus(0); // 0 = inactive
  }

  @Get('active') // get all active services 
  async getActiveServices() {
    return await this.serviceManagementService.getServicesByStatus(1); // 1 = active
  }

  @Get(':id') // fet a particular service by id 
  async getServiceById(@Param('id') id: string) {
    return await this.serviceManagementService.getServiceById(id);
  }

  @Put(':id') // edit / update a service 
  async updateServices(@Param('id') id: string, @Body() dto: CreateServiceDto) {
    return await this.serviceManagementService.updateServices(id, dto);
  }

  @Delete(':id') // Delete a service 
  async softDeleteService(@Param('id') id: string) {
    return await this.serviceManagementService.softDeleteService(id);
  }
}
