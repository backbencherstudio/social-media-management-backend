import { Controller, Get, Param, Patch, Body, Req, Query, UseGuards } from '@nestjs/common';
import { AssetsService } from './assets.service';
import { PostService as ResellerPostService } from '../../reseller/post/post.service';
import { DesignFileService } from '../../reseller/design-file/design-file.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('user/assets')
export class AssetsController {
  constructor(
    private readonly assetsService: AssetsService,
    private readonly resellerPostService: ResellerPostService,
    private readonly designFileService: DesignFileService,
    private readonly prisma: PrismaService,
  ) { }

  @Get()
  async getDesignFiles(@Req() req) {
    const userId = req.user?.userId;
    return this.assetsService.getDesignFiles(userId);
  }

  @Get('queue')
  async getContentQueue(
    @Req() req,
    @Query('status') status?: string,
    @Query('date') date?: string,
  ) {
    const userId = req.user?.userId;
    return await this.assetsService.getContentQueue(userId, status, date);
  }

  @Patch(':type/:id/review')
  async reviewItem(
    @Req() req,
    @Param('type') type: 'file' | 'post',
    @Param('id') id: string,
    @Body('status') status: 1 | 2,
    @Body('feedback') feedback?: string,
  ) {
    const userId = req.user?.userId;
    if (type === 'file') {
      const file = await this.prisma.designFile.findFirst({
        where: { id: id, task: { user_id: userId } },
      });
      if (!file) return { success: false, message: 'File not found or not allowed' };
      return this.designFileService.reviewDesignFile(file.id, status, feedback);
    } else if (type === 'post') {
      const post = await this.prisma.post.findFirst({
        where: { id: id, task: { user_id: userId } },
      });
      if (!post) return { success: false, message: 'Post not found or not allowed' };
      return this.resellerPostService.reviewPost(post.id, status, feedback);
    } else {
      return { success: false, message: 'Invalid type' };
    }
  }
}
