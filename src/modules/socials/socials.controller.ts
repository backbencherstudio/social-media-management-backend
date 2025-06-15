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

// todo: reolace req.user.userId
@Controller('socials')
export class SocialsController {
  constructor(private readonly socialsService: SocialsService) { }

  @UseGuards(JwtAuthGuard)
  @Get('connections')
  async getSocialConnections(@Req() req) {
    return this.socialsService.getConnections(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('disconnect/:provider')
  async disconnect(@Req() req, @Param('provider') provider: string) {
    return this.socialsService.disconnect(req.user.userId, provider);
  }

  // New endpoints for manual credential management
  @UseGuards(JwtAuthGuard)
  @Post('connect/manual')
  async connectWithCredentials(
    @Req() req,
    @Body() credentials: CreateCredentialDto,
  ) {
   

    return this.socialsService.connectWithCredentials(req.user.userId, credentials);
  }

  @UseGuards(JwtAuthGuard)
  @Get('pages/:provider')
  async getPages(@Req() req, @Param('provider') provider: string) {
   
    return this.socialsService.getPages(req.user.userId, provider);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile/:provider')
  async getProfile(@Req() req, @Param('provider') provider: string) {
   
    return this.socialsService.getProfile(req.user.userId, provider);
  }

  @UseGuards(JwtAuthGuard)
  @Get('posts/:provider')
  async getSocialPosts(@Req() req, @Param('provider') provider: string) {
   
    return this.socialsService.fetchPostsByProvider(req.user.userId, provider);
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

      const result = await this.socialsService['twitterService'].testConnection(account.access_token);
      return result;
    } catch (error) {
      return {
        success: false,
        message: error.message,
        error: error
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
    @Query('end') end: string
  ) {
    return this.socialsService.getFollowerActivity(req.user.userId, provider, start, end);
  }
}
