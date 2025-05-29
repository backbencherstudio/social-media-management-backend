import { Controller, Get, Post, Body, Patch, Param, Delete, Query, BadRequestException } from '@nestjs/common';
import { ResellerService } from './reseller.service';


@Controller('reseller')
export class ResellerController {
  constructor(private readonly resellerService: ResellerService) {}
// Route to handle accept reseller application
  @Post('application/accept/:applicationId') 
  async acceptResellerApplication(
    @Param('applicationId') applicationId: string, 
    @Body('id') id: string, 
  ) {
    try {
      const result = await this.resellerService.handleResellerApplication(id, applicationId, 'accept');

  
      if (result.success) {
        return {
          success: true,
          message: result.message,
          data: result.data,
        };
      } else {
        throw new BadRequestException(result.message); 
      }
    } catch (error) {
      throw new BadRequestException(`Error handling reseller application: ${error.message}`); 
    }
  }
  // Route to handle rejecting reseller application
  @Post('application/reject/:applicationId') 
  async rejectResellerApplication(
    @Param('applicationId') applicationId: string, 
    @Body('id') id: string, 
  ) {
    try {
      const result = await this.resellerService.handleResellerApplication(id, applicationId, 'reject');

 
      if (result.success) {
        return {
          success: true,
          message: result.message,
          data: result.data,
        };
      } else {
        throw new BadRequestException(result.message); 
      }
    } catch (error) {
      throw new BadRequestException(`Error handling reseller application: ${error.message}`);
    }
  }
  // Route to get all reseller application
  @Get('allApplications')
  findAllApplication() {
    return this.resellerService.getAllApplication();
  }
    // Route to get reseller 
  @Get('allresellers')
  findAllResellers() {
    return this.resellerService.findAllResellers();
  }
  // Route to get one application
  @Get('application/:applicationId')
  async getOneApplication(@Param('applicationId') applicationId: string) {
    try {
      const result = await this.resellerService.getOneApplication(applicationId);
  
      if (result.success) {
        return {
          success: true,
          message: result.message,
          data: result.data,
        };
      } else {
        throw new BadRequestException(result.message);
      }
    } catch (error) {
      throw new BadRequestException(
        error?.message || 'Error fetching reseller application',
      );
    }
  }
// toggle the status
  @Patch(':id')
  async toggleStatus(@Param('id') id: string) {
    return this.resellerService.toggleStatus(id);
  }
}
  
