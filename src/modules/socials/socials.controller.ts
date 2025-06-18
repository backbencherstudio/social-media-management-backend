import {
  Controller,
  Get,
  Req,
  UseGuards,
  Delete,
  Param,
  Post,
  Body,
  Put,
  Query,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SocialsService } from './socials.service';
import { CreateCredentialDto } from './dto/createCredentialDto';
import { PublishPostDto } from './dto/publish-post.dto';

// todo: reolace req.user.userId
@Controller('socials')
export class SocialsController {
  constructor(private readonly socialsService: SocialsService) { }

  @UseGuards(JwtAuthGuard)
  @Post('connect/manual')
  async connectWithCredentials(
    @Req() req,
    @Body() credentials: CreateCredentialDto,
  ) {
    const userId = 'cmc0017yi0000ws5cqy5qybiy';
    return this.socialsService.connectWithCredentials(userId, credentials);
  }

  @UseGuards(JwtAuthGuard)
  @Get('connections')
  async getSocialConnections(@Req() req) {
    return this.socialsService.getConnections(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('disconnect/:provider')
  async disconnect(@Req() req, @Param('provider') provider: string) {
    const userId = 'cmc0017yi0000ws5cqy5qybiy';
    return this.socialsService.disconnect(userId, provider);
  }

  @UseGuards(JwtAuthGuard)
  @Get('pages/:provider')
  async getPages(@Req() req, @Param('provider') provider: string) {
    const userId = 'cmc0017yi0000ws5cqy5qybiy';
    return this.socialsService.getPages(userId, provider);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile/:provider')
  async getProfile(@Req() req, @Param('provider') provider: string) {
    const userId = 'cmc0017yi0000ws5cqy5qybiy';
    return this.socialsService.getProfile(userId, provider);
  }

  @UseGuards(JwtAuthGuard)
  @Get('posts/:provider')
  async getSocialPosts(@Req() req, @Param('provider') provider: string) {
    const userId = 'cmc0017yi0000ws5cqy5qybiy';
    return this.socialsService.fetchPostsByProvider(userId, provider);
  }

  @UseGuards(JwtAuthGuard)
  @Get('analytics/:provider')
  async getAnalytics(@Req() req, @Param('provider') provider: string) {
    return this.socialsService.getAnalytics(req.user.userId, provider);
  }

  @UseGuards(JwtAuthGuard)
  @Put('credentials/:provider')
  async updateCredentials(
    @Req() req,
    @Param('provider') provider: string,
    @Body()
    credentials: {
      accessToken: string;
      refreshToken?: string;
      providerAccountId?: string;
    },
  ) {
    return this.socialsService.updateCredentials(
      req.user.userId,
      provider,
      credentials,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('test-connection/:provider')
  async testConnection(@Req() req, @Param('provider') provider: string) {
    return this.socialsService.testConnection(req.user.userId, provider);
  }

  @UseGuards(JwtAuthGuard)
  @Get('test-twitter-api')
  async testTwitterApi(@Req() req) {
    try {
      const account = await this.socialsService['prisma'].account.findFirst({
        where: { user_id: req.user.userId, provider: 'twitter' },
      });

      if (!account) {
        return { success: false, message: 'Twitter account not found' };
      }

      const result = await this.socialsService['twitterService'].testConnection(
        account.access_token,
      );
      return result;
    } catch (error) {
      return {
        success: false,
        message: error.message,
        error: error,
      };
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('test-auth')
  async testAuth(@Req() req) {
    return {
      success: true,
      message: 'JWT token is valid',
      user: req.user,
      userId: req.user?.userId,
      email: req.user?.email,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('follower-activity/:provider')
  async getFollowerActivity(
    @Req() req,
    @Param('provider') provider: string,
    @Query('start') start: string,
    @Query('end') end: string,
  ) {
    return this.socialsService.getFollowerActivity(
      req.user.userId,
      provider,
      start,
      end,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('publish/:provider')
  async publishPost(
    @Req() req,
    @Param('provider') provider: string,
    @Body() postData: PublishPostDto,
  ) {
    const userId = 'cmc0017yi0000ws5cqy5qybiy';
    return this.socialsService.publishPost(userId, provider, postData);
  }

  @UseGuards(JwtAuthGuard)
  @Get('posts/performance/all')
  async getAllProvidersRecentPosts(@Req() req) {
    return this.socialsService.fetchPostsPerformanceAllProviders(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('audience-demographics/:provider')
  async getAudienceDemographics(@Req() req, @Param('provider') provider: string) {
    return this.socialsService.getAudienceDemographics(req.user.userId, provider);
  }

  @UseGuards(JwtAuthGuard)
  @Get('messages/:provider')
  async getMessages(@Req() req, @Param('provider') provider: string) {
    const userId = 'cmc0017yi0000ws5cqy5qybiy';
    return this.socialsService.getMessages(userId, provider);
  }

  @UseGuards(JwtAuthGuard)
  @Post('messages/:provider/reply')
  async sendMessage(
    @Req() req,
    @Param('provider') provider: string,
    @Body() body: { conversationId: string; text: string }
  ) {
    return this.socialsService.sendMessage(req.user.userId, provider, body);
  }
}
