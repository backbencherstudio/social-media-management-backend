import { Controller, Get, Post, Body, Patch, Param, Delete, Query, BadRequestException } from '@nestjs/common';
import { ResellerService } from './reseller.service';

@Controller('reseller')
export class ResellerController {
  constructor(private readonly resellerService: ResellerService) {}

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

}
