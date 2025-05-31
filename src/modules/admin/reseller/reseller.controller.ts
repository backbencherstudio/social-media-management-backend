import { Controller, Get, Post, Body, Patch, Param, Delete, Query, BadRequestException, Put } from '@nestjs/common';
import { ResellerService } from './reseller.service';
import { TaskManagementService } from '../task_management/task_management.service';


@Controller('reseller')
export class ResellerController {
  constructor(private readonly resellerService: ResellerService,private readonly taskAssignService: TaskManagementService) {}
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
  //get all resellers
   @Get('all') 
  async getAllResellers() {
    try {
      const resellers = await this.resellerService.getAllResellers();
      return {
        success: true,
        data: resellers,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Error fetching resellers',
      };
    }
  }
  //get all applications
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
    //get only one reseller
  @Get(':resellerId')
  async getReseller(@Param('resellerId') resellerId: string) {
    const result = await this.resellerService.getResellerById(resellerId);
    return result;
  }
// toggle the status
  @Patch(':id')
  async toggleStatus(@Param('id') id: string) {
    return this.resellerService.toggleStatus(id);
  }
  //complete
 @Patch('complete/:taskId/:resellerId')
  async completeTask(
    @Param('taskId') taskId: string,
    @Param('resellerId') resellerId: string,
  ){
    await this.resellerService.completeTask(taskId, resellerId);
  }
// admin release payment
    @Post(':resellerId/release-payment')
  async releasePayment(@Param('resellerId') resellerId: string) {
    const result = await this.resellerService.releasePayment(resellerId);
    return result;
  }
}

  
