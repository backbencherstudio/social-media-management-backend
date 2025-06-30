import { Controller, Get, Post, Body, Patch, Param, Delete, Req, Query, UseGuards } from '@nestjs/common';
import { PostService } from './post.service';
import { PostService as ResellerPostService } from '../../reseller/post/post.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { CreateClientQuestionnaireDto } from './dto/create-client-questionnaire.dto';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@UseGuards(JwtAuthGuard)
@Controller('user/posts')
export class PostController {
  constructor(
    private readonly postService: PostService,
    private readonly resellerPostService: ResellerPostService,
    private readonly prisma: PrismaService,
  ) { }

  @Get()
  async findAll(@Req() req) {
    const userId = req.user?.userId;
    return this.postService.findAll(userId);
  }

  @Get('calendar')
  async getScheduledPostsForCalendar(
    @Query('start') start: string,
    @Query('end') end: string,
    @Req() req,
  ) {
    try {
      const startDate = new Date(start);
      const endDate = new Date(end);
      const userId = req.user?.userId;
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return { success: false, message: 'Invalid start or end date' };
      }

      return await this.resellerPostService.getScheduledPostsForCalendar(startDate, endDate, userId);
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  @Get('upcoming')
  getUpcomingPosts(@Req() req) {
    const userId = req.user?.userId;
    return this.resellerPostService.getUpcomingPosts(userId);
  }

  @Get(':id')
  async findOne(@Req() req, @Param('id') id: string) {
    const userId = req.user?.userId;
    return this.postService.findOne(userId, id);
  }

  @Patch(':id/review')
  async reviewPost(
    @Req() req,
    @Param('id') id: string,
    @Body('status') status: 1 | 2,
    @Body('feedback') feedback?: string,
  ) {
    const userId = req.user?.userId;
    const post = await this.prisma.post.findFirst({
      where: { id: id, task: { user_id: userId } },
    });
    if (!post) return { success: false, message: 'Post not found or not allowed' };
    return this.resellerPostService.reviewPost(id, status, feedback);
  }

  @ApiOperation({ summary: 'Create or update a client questionnaire' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('questionnaire')
  async createOrUpdateClientQuestionnaire(
    @Req() req: any,
    @Body() createData: CreateClientQuestionnaireDto,
  ) {
    const userId = req.user.userId;
    return this.postService.createOrUpdateClientQuestionnaire(userId, createData);
  }
}
