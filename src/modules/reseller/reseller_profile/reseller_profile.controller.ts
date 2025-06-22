import { Controller, Get, Post, Body, Patch, Param, Delete, Req, NotFoundException, HttpException, HttpStatus } from '@nestjs/common';
import { ResellerProfileService } from './reseller_profile.service';
import { CreateResellerProfileDto } from './dto/create-reseller_profile.dto';
import { UpdateResellerProfileDto } from './dto/update-reseller_profile.dto';
import { WithdrawPaymentDto } from './dto/withdraw-payment-dto';
import { StripePayment } from 'src/common/lib/Payment/stripe/StripePayment';
import { CreatePayoutDto } from './dto/create-payout-dto';
import { PrismaService } from 'src/prisma/prisma.service';


@Controller('reseller-profile')
export class ResellerProfileController {
  constructor(private readonly resellerProfileService: ResellerProfileService , private readonly prisma: PrismaService) {}


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
@Post(':resellerId/withdraw/:accountId')
async withdraw(
  @Param('resellerId') resellerId: string,
  @Param('accountId') accountId: string,
  @Body() body: WithdrawPaymentDto
) {
  try {

    const account_id = accountId;

    // Call the service to handle the withdrawal
    const result = await this.resellerProfileService.resellerPaymentWithdrawal(
   
      resellerId,
      account_id,
      body
    );

    // Return the result, keeping a consistent structure
    return {
      status: 'success',
      message: result.message,
      data: result.data,
    };
  } catch (error) {
    console.error('Error in withdrawal process:', error);
    throw new HttpException(
      'Failed to process withdrawal. Please try again later.',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

// create connect account for payout
    @Post('create-connect-account-payout')
  async create(@Body() createPayoutDto: CreatePayoutDto,
    @Req() req: Request,) {

    try {
      const response = await StripePayment.createConnectedAccount(createPayoutDto.email);

      const user_id = "cmb1qwp4z0000ree0q2ikxruz";
      console.log(user_id, "user_id")
      const user = await this.prisma.user.findUnique({
        where: {  id: user_id }
      });
      if (!user) {
        throw new NotFoundException('User not found');
      }
      await this.prisma.user.update({
        where: { id: user_id },
        data:{
          banking_id: response.id,
        }
      })

      return {
        response:response.id
      }
    }
    catch (error) {
      throw error
    }
  }

  // connect account onboarding link
  @Post('create-connect-account/:account_id')
  StripeConnect(
    @Param('account_id') account_id: string) {
    return StripePayment.createOnboardingAccountLink(account_id);
  }
}