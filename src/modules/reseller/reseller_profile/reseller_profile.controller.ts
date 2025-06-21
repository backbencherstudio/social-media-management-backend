import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ResellerProfileService } from './reseller_profile.service';
import { CreateResellerProfileDto } from './dto/create-reseller_profile.dto';
import { UpdateResellerProfileDto } from './dto/update-reseller_profile.dto';

@Controller('reseller-profile')
export class ResellerProfileController {
  constructor(private readonly resellerProfileService: ResellerProfileService) {}


    @Get('reseller/:resellerId')
  async getResellerTasks(@Param('resellerId') resellerId: string) {
    const result = await this.resellerProfileService.getOneResellerTask(resellerId);
    return result;
  }

  @Get('completed/:resellerId')
  async getAllCompletedTasks(@Param('resellerId') resellerId: string) {
    return this.resellerProfileService.getAllCompletedTasks(resellerId);
  }
}
