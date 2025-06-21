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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

@ApiTags('Socials')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('socials')
export class SocialsController {
  constructor(private readonly socialsService: SocialsService) { }

  @Get(':userId/stats')
  @ApiOperation({ summary: 'Get social media stats for a user' })
  @ApiResponse({
    status: 200,
    description: 'Social media stats fetched successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  getSocialStats(@Param('userId') userId: string) {
    return this.socialsService.getSocialStats(userId);
  }

  @Post(':userId/connect/manual')
  @ApiOperation({ summary: 'Manually connect a social media account for a user' })
  async connectWithCredentials(
    @Param('userId') userId: string,
    @Body() credentials: CreateCredentialDto,
  ): Promise<ConnectionResult> {
    return this.socialsService.connectWithCredentials(userId, credentials);
  }

  @Get(':userId/connections')
  @ApiOperation({ summary: 'Get all social media connections for a user' })
  async getSocialConnections(
    @Param('userId') userId: string,
  ): Promise<ConnectionResult> {
    return this.socialsService.getConnections(userId);
  }

  @Delete(':userId/disconnect/:provider')
  @ApiOperation({ summary: 'Disconnect a social media account for a user' })
  async disconnect(
    @Param('userId') userId: string,
    @Param('provider') provider: SupportedProvider,
  ): Promise<ConnectionResult> {
    return this.socialsService.disconnect(userId, provider);
  }

  @Post(':userId/publish/:provider')
  @ApiOperation({ summary: 'Publish a post to a social media platform for a user' })
  async publishPost(
    @Param('userId') userId: string,
    @Param('provider') provider: SupportedProvider,
    @Body() postData: PublishPostDto,
  ): Promise<ConnectionResult> {
    return this.socialsService.publishPost(userId, provider, postData);
  }

  @Get(':userId/pages/:provider')
  @ApiOperation({ summary: 'Get available pages for a provider for a user' })
  async getPages(
    @Param('userId') userId: string,
    @Param('provider') provider: SupportedProvider,
  ): Promise<ConnectionResult> {
    return this.socialsService.getPages(userId, provider);
  }

  @Get(':userId/profile/:provider')
  @ApiOperation({ summary: 'Get user profile for a provider' })
  async getProfile(
    @Param('userId') userId: string,
    @Param('provider') provider: SupportedProvider,
  ): Promise<ConnectionResult> {
    return this.socialsService.getProfile(userId, provider);
  }

  @Get(':userId/posts/:provider')
  @ApiOperation({ summary: 'Get posts from a specific provider for a user' })
  async getSocialPosts(
    @Param('userId') userId: string,
    @Param('provider') provider: SupportedProvider,
  ): Promise<ConnectionResult> {
    return this.socialsService.fetchPostsByProvider(userId, provider);
  }

  @Get(':userId/analytics/:provider')
  @ApiOperation({ summary: 'Get analytics for a provider for a user' })
  async getAnalytics(
    @Param('userId') userId: string,
    @Param('provider') provider: SupportedProvider,
  ): Promise<ConnectionResult> {
    return this.socialsService.getAnalytics(userId, provider);
  }

  @Put(':userId/credentials/:provider')
  @ApiOperation({ summary: 'Update credentials for a provider for a user' })
  async updateCredentials(
    @Param('userId') userId: string,
    @Param('provider') provider: SupportedProvider,
    @Body()
    credentials: {
      accessToken: string;
      refreshToken?: string;
      providerAccountId?: string;
    },
  ): Promise<ConnectionResult> {
    return this.socialsService.updateCredentials(
      userId,
      provider,
      credentials,
    );
  }

  @Get(':userId/test-connection/:provider')
  @ApiOperation({ summary: 'Test connection to a provider for a user' })
  async testConnection(
    @Param('userId') userId: string,
    @Param('provider') provider: SupportedProvider,
  ): Promise<ConnectionResult> {
    return this.socialsService.testConnection(userId, provider);
  }

  @Get(':userId/follower-activity/:provider')
  @ApiOperation({ summary: 'Get follower activity for a provider for a user' })
  async getFollowerActivity(
    @Param('userId') userId: string,
    @Param('provider') provider: SupportedProvider,
    @Query('start') start?: string,
    @Query('end') end?: string,
  ): Promise<ConnectionResult> {
    return this.socialsService.getFollowerActivity(
      userId,
      provider,
      start,
      end,
    );
  }

  @Get(':userId/posts/performance/all')
  @ApiOperation({ summary: 'Get posts performance from all providers for a user' })
  async getAllProvidersRecentPosts(
    @Param('userId') userId: string,
  ): Promise<ConnectionResult> {
    return this.socialsService.fetchPostsPerformanceAllProviders(userId);
  }

  @Get(':userId/audience-demographics/:provider')
  @ApiOperation({ summary: 'Get audience demographics for a provider for a user' })
  async getAudienceDemographics(
    @Param('userId') userId: string,
    @Param('provider') provider: SupportedProvider,
  ): Promise<ConnectionResult> {
    return this.socialsService.getAudienceDemographics(userId, provider);
  }

  @Get(':userId/messages/:provider')
  @ApiOperation({ summary: 'Get messages for a provider for a user' })
  async getMessages(
    @Param('userId') userId: string,
    @Param('provider') provider: SupportedProvider,
  ): Promise<ConnectionResult> {
    return this.socialsService.getMessages(userId, provider);
  }

  @Post(':userId/messages/:provider/reply')
  @ApiOperation({ summary: 'Send a reply message for a user' })
  async sendMessage(
    @Param('userId') userId: string,
    @Param('provider') provider: SupportedProvider,
    @Body() body: { conversationId: string; text: string },
  ): Promise<ConnectionResult> {
    return this.socialsService.sendMessage(userId, provider, body);
  }
}
