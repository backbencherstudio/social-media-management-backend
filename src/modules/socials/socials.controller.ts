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
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SocialsService } from './socials.service';
import { CreateCredentialDto } from './dto/createCredentialDto';
import { PublishPostDto } from './dto/publish-post.dto';
import { SupportedProvider, ConnectionResult } from './types';

@Controller('socials')
export class SocialsController {
  constructor(private readonly socialsService: SocialsService) { }

  @UseGuards(JwtAuthGuard)
  @Post('connect/manual')
  async connectWithCredentials(
    @Req() req: any,
    @Body() credentials: CreateCredentialDto,
  ): Promise<ConnectionResult> {
    const userId = "cmc0017yi0000ws5cqy5qybiy";
    if (!userId) {
      throw new BadRequestException('User ID not found in request');
    }
    return this.socialsService.connectWithCredentials(userId, credentials);
  }

  @UseGuards(JwtAuthGuard)
  @Get('connections')
  async getSocialConnections(@Req() req: any): Promise<ConnectionResult> {
    const userId = "cmc0017yi0000ws5cqy5qybiy";
    if (!userId) {
      throw new BadRequestException('User ID not found in request');
    }
    return this.socialsService.getConnections(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('disconnect/:provider')
  async disconnect(@Req() req: any, @Param('provider') provider: SupportedProvider): Promise<ConnectionResult> {
    const userId = "cmc0017yi0000ws5cqy5qybiy";
    if (!userId) {
      throw new BadRequestException('User ID not found in request');
    }
    return this.socialsService.disconnect(userId, provider);
  }

  @UseGuards(JwtAuthGuard)
  @Post('publish/:provider')
  async publishPost(
    @Req() req: any,
    @Param('provider') provider: SupportedProvider,
    @Body() postData: PublishPostDto,
  ): Promise<ConnectionResult> {
    const userId = "cmc0017yi0000ws5cqy5qybiy";
    if (!userId) {
      throw new BadRequestException('User ID not found in request');
    }
    return this.socialsService.publishPost(userId, provider, postData);
  }

  @UseGuards(JwtAuthGuard)
  @Get('pages/:provider')
  async getPages(@Req() req: any, @Param('provider') provider: SupportedProvider): Promise<ConnectionResult> {
    const userId = "cmc0017yi0000ws5cqy5qybiy";
    if (!userId) {
      throw new BadRequestException('User ID not found in request');
    }
    return this.socialsService.getPages(userId, provider);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile/:provider')
  async getProfile(@Req() req: any, @Param('provider') provider: SupportedProvider): Promise<ConnectionResult> {
    const userId = "cmc0017yi0000ws5cqy5qybiy";
    if (!userId) {
      throw new BadRequestException('User ID not found in request');
    }
    return this.socialsService.getProfile(userId, provider);
  }

  @UseGuards(JwtAuthGuard)
  @Get('posts/:provider')
  async getSocialPosts(@Req() req: any, @Param('provider') provider: SupportedProvider): Promise<ConnectionResult> {
    console.log("user from twitter", req.user)
    const userId = "cmc0017yi0000ws5cqy5qybiy";
    if (!userId) {
      throw new BadRequestException('User ID not found in request');
    }
    return this.socialsService.fetchPostsByProvider(userId, provider);
  }

  @UseGuards(JwtAuthGuard)
  @Get('analytics/:provider')
  async getAnalytics(@Req() req: any, @Param('provider') provider: SupportedProvider): Promise<ConnectionResult> {
    const userId = "cmc0017yi0000ws5cqy5qybiy";
    if (!userId) {
      throw new BadRequestException('User ID not found in request');
    }
    return this.socialsService.getAnalytics(userId, provider);
  }

  @UseGuards(JwtAuthGuard)
  @Put('credentials/:provider')
  async updateCredentials(
    @Req() req: any,
    @Param('provider') provider: SupportedProvider,
    @Body()
    credentials: {
      accessToken: string;
      refreshToken?: string;
      providerAccountId?: string;
    },
  ): Promise<ConnectionResult> {
    const userId = "cmc0017yi0000ws5cqy5qybiy";
    if (!userId) {
      throw new BadRequestException('User ID not found in request');
    }
    return this.socialsService.updateCredentials(userId, provider, credentials);
  }

  @UseGuards(JwtAuthGuard)
  @Get('test-connection/:provider')
  async testConnection(@Req() req: any, @Param('provider') provider: SupportedProvider): Promise<ConnectionResult> {
    const userId = "cmc0017yi0000ws5cqy5qybiy";
    if (!userId) {
      throw new BadRequestException('User ID not found in request');
    }
    return this.socialsService.testConnection(userId, provider);
  }

  @UseGuards(JwtAuthGuard)
  @Get('test-twitter-api')
  async testTwitterApi(@Req() req: any): Promise<any> {
    try {
      const userId = "cmc0017yi0000ws5cqy5qybiy";
      if (!userId) {
        throw new BadRequestException('User ID not found in request');
      }

      const account = await this.socialsService['prisma'].account.findFirst({
        where: { user_id: userId, provider: 'twitter' },
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
  async testAuth(@Req() req: any): Promise<any> {
    return {
      success: true,
      message: 'JWT token is valid',
      user: req.user,
      userId: "cmc0017yi0000ws5cqy5qybiy",
      email: req.user?.email,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('follower-activity/:provider')
  async getFollowerActivity(
    @Req() req: any,
    @Param('provider') provider: SupportedProvider,
    @Query('start') start?: string,
    @Query('end') end?: string,
  ): Promise<ConnectionResult> {
    const userId = "cmc0017yi0000ws5cqy5qybiy";
    if (!userId) {
      throw new BadRequestException('User ID not found in request');
    }
    return this.socialsService.getFollowerActivity(userId, provider, start, end);
  }

  @UseGuards(JwtAuthGuard)
  @Get('posts/performance/all')
  async getAllProvidersRecentPosts(@Req() req: any): Promise<ConnectionResult> {
    const userId = "cmc0017yi0000ws5cqy5qybiy";
    if (!userId) {
      throw new BadRequestException('User ID not found in request');
    }
    return this.socialsService.fetchPostsPerformanceAllProviders(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('audience-demographics/:provider')
  async getAudienceDemographics(@Req() req: any, @Param('provider') provider: SupportedProvider): Promise<ConnectionResult> {
    const userId = "cmc0017yi0000ws5cqy5qybiy";
    if (!userId) {
      throw new BadRequestException('User ID not found in request');
    }
    return this.socialsService.getAudienceDemographics(userId, provider);
  }

  @UseGuards(JwtAuthGuard)
  @Get('messages/:provider')
  async getMessages(@Req() req: any, @Param('provider') provider: SupportedProvider): Promise<ConnectionResult> {
    const userId = "cmc0017yi0000ws5cqy5qybiy";
    if (!userId) {
      throw new BadRequestException('User ID not found in request');
    }
    return this.socialsService.getMessages(userId, provider);
  }

  @UseGuards(JwtAuthGuard)
  @Post('messages/:provider/reply')
  async sendMessage(
    @Req() req: any,
    @Param('provider') provider: SupportedProvider,
    @Body() body: { conversationId: string; text: string }
  ): Promise<ConnectionResult> {
    const userId = "cmc0017yi0000ws5cqy5qybiy";
    if (!userId) {
      throw new BadRequestException('User ID not found in request');
    }
    return this.socialsService.sendMessage(userId, provider, body);
  }
}
