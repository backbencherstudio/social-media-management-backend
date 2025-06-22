import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ResellerProfileService } from './reseller_profile.service';
import { CreateResellerProfileDto } from './dto/create-reseller_profile.dto';
import { UpdateResellerProfileDto } from './dto/update-reseller_profile.dto';
import { WithdrawPaymentDto } from './dto/cwithdraw-payment-dto';


@Controller('reseller-profile')
export class ResellerProfileController {
  constructor(private readonly resellerProfileService: ResellerProfileService) {}


    @Get('reseller/:resellerId')
  async getResellerTasks(@Param('resellerId') resellerId: string) {
    const result = await this.resellerProfileService.getOneResellerTask(resellerId);
    return result;
  }

    @Get('completed/:resellerId')
  async getResellerEarningsAndTasks(@Param('resellerId') resellerId: string) {
    try {
      const result = await this.resellerProfileService.getResellerEarningsAndTasks(resellerId);
      return result;
    } catch (error) {
      return {
        message: 'Error fetching reseller data',
        error: error.message,
      };
    }
  }

  @Get('Onetask/:taskId/:resellerId')
  async getOneTask(@Param('taskId') taskId: string, @Param('resellerId') resellerId: string) {
    const result = await this.resellerProfileService.getTaskDetails(taskId, resellerId);
    return result;
  }


 @Post(':resellerId/withdraw')
  async withdraw(
    @Param('resellerId') resellerId: string,
    @Body() body: WithdrawPaymentDto
  ) {
    return this.resellerProfileService.resellerPaymentWithdrawal(
      resellerId,
      body.amount,
      body.metjod
    );
  }
}