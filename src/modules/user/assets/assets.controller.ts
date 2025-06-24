import { Controller, Get, Param, Patch, Body, Req } from '@nestjs/common';
import { AssetsService } from './assets.service';

@Controller('user/assets')
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) { }

  @Get()
  async getDesignFiles(@Req() req) {
    const userId = 'cmc0017yi0000ws5cqy5qybiy'
    return this.assetsService.getDesignFiles(userId);
  }

  @Patch(':id/review')
  async reviewDesignFile(
    @Req() req,
    @Param('id') id: string,
    @Body('status') status: 1 | 2,
    @Body('feedback') feedback?: string,
  ) {
    const userId = 'cmc0017yi0000ws5cqy5qybiy'
    return this.assetsService.reviewDesignFile(userId, id, status, feedback);
  }
}
