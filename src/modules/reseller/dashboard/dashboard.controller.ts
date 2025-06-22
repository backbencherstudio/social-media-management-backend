import { Controller, Get, Post, Body, Patch, Param, Delete, Req, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { CreateDashboardDto } from './dto/create-dashboard.dto';
import { UpdateDashboardDto } from './dto/update-dashboard.dto';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Reseller')
@ApiBearerAuth()
//@UseGuards(JwtAuthGuard)
@Controller('reseller/dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) { }

  @Post()
  create(@Body() createDashboardDto: CreateDashboardDto) {
    return this.dashboardService.create(createDashboardDto);
  }

  @Get('analysis')
  getDashboardStats(@Req() req) {
    const userId = "cmb1qwp4z0000ree0q2ikxruz"
    return this.dashboardService.getDashboardStats(userId)
  }

  @Get('clients')
  findAllClients(@Req() req) {
    const resellerId = "RES_n461l81lt1q8naigks2170vm"
    return this.dashboardService.findAllClients(resellerId)
  }

  @Get('clients/:userId')
  findOneClient(@Param('userId') userId: string, @Req() req) {
    // Assuming the reseller ID is on req.user.id from the JWT payload
    const resellerId = req.user.id;
    return this.dashboardService.findOneClient(resellerId, userId);
  }

  @Get('active-services')
  findAllActiveServices() {
    return this.dashboardService.findAllActiveServices();
  }

  @Get('active-services/:id')
  findOneActiveService(@Param('id') id: string) {
    return this.dashboardService.findOneActiveService(id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.dashboardService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDashboardDto: UpdateDashboardDto) {
    return this.dashboardService.update(+id, updateDashboardDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.dashboardService.remove(+id);
  }
}
