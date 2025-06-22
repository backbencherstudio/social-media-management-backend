import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { FacebookService } from './platforms/facebook.service';
import { InstagramService } from './platforms/instagram.service';
import { TwitterService } from './platforms/twitter.service';
import { LinkedInService } from './platforms/linkedin.service';
import { CreateCredentialDto } from './dto/createCredentialDto';
import { ProviderValidatorService } from './providers/provider-validator.service';
import {
  SupportedProvider,
  ConnectionResult,
  PostData,
  FormattedPost,
  MessageBody
} from './types';

// Constants
const SUPPORTED_PROVIDERS = ['twitter', 'facebook', 'instagram', 'linkedin'] as const;
const TOKEN_EXPIRY_HOURS = 24;
const MILLISECONDS_PER_HOUR = 60 * 60 * 1000;

@Injectable()
export class SocialsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly facebookService: FacebookService,
    private readonly instagramService: InstagramService,
    private readonly twitterService: TwitterService,
    private readonly linkedinService: LinkedInService,
    private readonly providerValidator: ProviderValidatorService,
  ) { }

  /**
   * Connect a social media account with user credentials
   * @param userId - The user's unique identifier
   * @param credentials - The social media credentials
   * @returns Connection result with success status and message
   */
  async connectWithCredentials(
    userId: string,
    credentials: CreateCredentialDto,
  ): Promise<ConnectionResult> {
    this.validateConnectionInput(userId, credentials);

    try {
      await this.validateUserExists(userId);
      await this.validateProviderAccount(credentials);

      const accountData = this.buildAccountData(userId, credentials);
      const account = await this.upsertAccount(accountData);

      return {
        success: true,
        message: `${credentials.provider} connected successfully`,
        data: { accountId: account.id, provider: account.provider },
      };
    } catch (error) {
      return this.handleConnectionError(error, credentials.provider);
    }
  }

  /**
   * Get all social media connections for a user
   * @param userId - The user's unique identifier
   * @returns List of connected social media platforms
   */
  async getConnections(userId: string): Promise<ConnectionResult> {
    try {
      const [channels, accounts] = await Promise.all([
        this.prisma.channel.findMany(),
        this.prisma.account.findMany({ where: { user_id: userId } }),
      ]);

      const connectionData = channels.map((channel) => {
        const matchedAccounts = this.findAccountsForChannel(accounts, channel.name);
        return {
          name: channel.name,
          status: matchedAccounts.length > 0 ? 'Connected' : 'Not Connected',
          details: matchedAccounts.length > 0
            ? matchedAccounts.map(acc => ({ username: acc.provider_account_id }))
            : null,
        };
      });

      return { success: true, data: connectionData };
    } catch (error) {
      return { success: false, message: `Failed to fetch connections: ${error.message}` };
    }
  }

  /**
   * Disconnect a social media account
   * @param userId - The user's unique identifier
   * @param provider - The social media provider to disconnect
   * @returns Disconnection result
   */
  async disconnect(userId: string, provider: string): Promise<ConnectionResult> {
    try {
      await this.prisma.account.deleteMany({
        where: { user_id: userId, provider },
      });
      return { success: true, message: `${provider} disconnected` };
    } catch (error) {
      return { success: false, message: `Failed to disconnect ${provider}: ${error.message}` };
    }
  }

  /**
   * Publish a post to a specific social media platform
   * @param userId - The user's unique identifier
   * @param provider - The social media provider
   * @param postData - The post content and metadata
   * @returns Publishing result
   */
  async publishPost(
    userId: string,
    provider: SupportedProvider,
    postData: PostData,
  ): Promise<ConnectionResult> {
    const serviceMap = {
      twitter: () => this.twitterService.publishPost(userId, postData),
      facebook: () => ({ success: false, message: 'Facebook posting not implemented yet' }),
      instagram: () => ({ success: false, message: 'Instagram posting not implemented yet' }),
      linkedin: () => ({ success: false, message: 'LinkedIn posting not implemented yet' }),
    };

    const service = serviceMap[provider];
    if (!service) {
      return { success: false, message: 'Provider not supported for posting' };
    }

    return service();
  }

  /**
   * Fetch posts performance data from all connected providers
   * @param userId - The user's unique identifier
   * @returns Aggregated posts performance data
   */
  async fetchPostsPerformanceAllProviders(userId: string): Promise<ConnectionResult> {
    try {
      const providerResults = await this.fetchAllProviderPosts(userId);
      const allPosts = this.aggregateAndFormatPosts(providerResults);

      return { success: true, data: allPosts };
    } catch (error) {
      return { success: false, message: `Failed to fetch posts: ${error.message}` };
    }
  }

  /**
   * Fetch posts from a specific provider
   * @param userId - The user's unique identifier
   * @param provider - The social media provider
   * @returns Provider-specific posts data
   */
  async fetchPostsByProvider(userId: string, provider: SupportedProvider): Promise<ConnectionResult> {
    const serviceMap = {
      facebook: () => this.facebookService.fetchPosts(userId),
      instagram: () => this.instagramService.fetchPosts(userId),
      twitter: async () => {
        const tweetsData = await this.twitterService.fetchPosts(userId);
        return this.formatTwitterPostsForPerformance(tweetsData);
      },
      linkedin: () => this.linkedinService.fetchPosts(userId),
    };

    try {
      const service = serviceMap[provider];
      if (!service) {
        return { success: false, message: 'Provider not supported' };
      }

      const data = await service();
      return { success: true, data };
    } catch (error) {
      return { success: false, message: `Failed to fetch ${provider} posts: ${error.message}` };
    }
  }

  /**
   * Get available pages for a provider
   * @param userId - The user's unique identifier
   * @param provider - The social media provider
   * @returns Available pages data
   */
  async getPages(userId: string, provider: SupportedProvider): Promise<ConnectionResult> {
    try {
      const account = await this.getUserAccount(userId, provider);

      const serviceMap = {
        facebook: () => this.facebookService.getPages(account.access_token),
        instagram: () => this.instagramService.getPages(account.access_token),
        linkedin: () => this.linkedinService.getPages(account.access_token),
        twitter: () => ({ success: false, message: 'Pages not available for Twitter' }),
      };

      const service = serviceMap[provider];
      if (!service) {
        return { success: false, message: 'Pages not available for this provider' };
      }

      const data = await service();
      return { success: true, data };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  /**
   * Get user profile for a specific provider
   * @param userId - The user's unique identifier
   * @param provider - The social media provider
   * @returns Profile data
   */
  async getProfile(userId: string, provider: SupportedProvider): Promise<ConnectionResult> {
    try {
      const account = await this.getUserAccount(userId, provider);

      const serviceMap = {
        facebook: () => this.facebookService.getProfile(account.access_token),
        instagram: () => this.instagramService.getProfile(account.access_token),
        twitter: () => this.twitterService.getProfile(account.access_token, account.provider_account_id),
        linkedin: () => this.linkedinService.getProfile(account.access_token),
      };

      const service = serviceMap[provider];
      if (!service) {
        return { success: false, message: 'Profile not available for this provider' };
      }

      const data = await service();
      return { success: true, data };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  /**
   * Get analytics for a specific provider
   * @param userId - The user's unique identifier
   * @param provider - The social media provider
   * @returns Analytics data
   */
  async getAnalytics(userId: string, provider: SupportedProvider): Promise<ConnectionResult> {
    try {
      const account = await this.getUserAccount(userId, provider);

      const serviceMap = {
        facebook: () => this.facebookService.getAnalytics(account.access_token),
        instagram: () => this.instagramService.getAnalytics(account.access_token),
        twitter: () => this.twitterService.getAnalytics(account.access_token, account.provider_account_id),
        linkedin: () => this.linkedinService.getAnalytics(account.access_token),
      };

      const service = serviceMap[provider];
      if (!service) {
        return { success: false, message: 'Analytics not available for this provider' };
      }

      const data = await service();
      return { success: true, data };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  /**
   * Update credentials for a connected account
   * @param userId - The user's unique identifier
   * @param provider - The social media provider
   * @param credentials - Updated credentials
   * @returns Update result
   */
  async updateCredentials(
    userId: string,
    provider: SupportedProvider,
    credentials: {
      accessToken: string;
      refreshToken?: string;
      providerAccountId?: string;
    },
  ): Promise<ConnectionResult> {
    try {
      const account = await this.getUserAccount(userId, provider);

      await this.prisma.account.update({
        where: { id: account.id },
        data: {
          access_token: credentials.accessToken,
          refresh_token: credentials.refreshToken,
          provider_account_id: credentials.providerAccountId || account.provider_account_id,
          expires_at: new Date(Date.now() + TOKEN_EXPIRY_HOURS * MILLISECONDS_PER_HOUR),
        },
      });

      return { success: true, message: `${provider} credentials updated successfully` };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  /**
   * Test connection to a social media platform
   * @param userId - The user's unique identifier
   * @param provider - The social media provider
   * @returns Test result
   */
  async testConnection(userId: string, provider: SupportedProvider): Promise<ConnectionResult> {
    try {
      const account = await this.getUserAccount(userId, provider);

      const serviceMap = {
        facebook: () => this.facebookService.testConnection(account.access_token),
        instagram: () => this.instagramService.testConnection(account.access_token),
        twitter: () => this.twitterService.testConnection(account.access_token),
        linkedin: () => this.linkedinService.testConnection(account.access_token),
      };

      const service = serviceMap[provider];
      if (!service) {
        return { success: false, message: 'Provider not supported for testing' };
      }

      const data = await service();
      return { success: true, data };
    } catch (error) {
      return { success: false, message: `Connection test failed: ${error.message}` };
    }
  }

  /**
   * Get follower activity for a provider
   * @param userId - The user's unique identifier
   * @param provider - The social media provider
   * @param start - Start date for activity range
   * @param end - End date for activity range
   * @returns Follower activity data
   */
  async getFollowerActivity(
    userId: string,
    provider: SupportedProvider,
    start?: string,
    end?: string,
  ): Promise<ConnectionResult> {
    const serviceMap = {
      facebook: () => this.facebookService.getFollowerActivity(userId, start, end),
      instagram: () => this.instagramService.getFollowerActivity(userId, start, end),
      twitter: () => this.twitterService.getFollowerActivity(userId, start, end),
      linkedin: () => this.linkedinService.getFollowerActivity(userId, start, end),
    };

    const service = serviceMap[provider];
    if (!service) {
      return { success: false, message: 'Provider not supported' };
    }

    return service();
  }

  /**
   * Get audience demographics for a provider
   * @param userId - The user's unique identifier
   * @param provider - The social media provider
   * @returns Demographics data
   */
  async getAudienceDemographics(userId: string, provider: SupportedProvider): Promise<ConnectionResult> {
    try {
      const account = await this.getUserAccount(userId, provider);

      const serviceMap = {
        facebook: () => this.facebookService.getAudienceDemographics(account.access_token, account.provider_account_id),
        instagram: () => this.instagramService.getAudienceDemographics(account.access_token, account.provider_account_id),
        twitter: () => ({ success: false, message: 'Demographics not available for Twitter' }),
        linkedin: () => ({ success: false, message: 'Demographics not available for LinkedIn' }),
      };

      const service = serviceMap[provider];
      if (!service) {
        return { success: false, message: 'Demographics not available for this provider' };
      }

      return service();
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  /**
   * Get messages for a provider
   * @param userId - The user's unique identifier
   * @param provider - The social media provider
   * @returns Messages data
   */
  async getMessages(userId: string, provider: SupportedProvider): Promise<ConnectionResult> {
    const serviceMap = {
      facebook: () => this.facebookService.getMessages(userId),
      twitter: () => this.twitterService.getMessages(userId),
      instagram: () => ({ success: false, message: 'Messages not available for Instagram' }),
      linkedin: () => ({ success: false, message: 'Messages not available for LinkedIn' }),
    };

    const service = serviceMap[provider];
    if (!service) {
      return { success: false, message: 'Provider not supported' };
    }

    return service();
  }

  /**
   * Send a message via a provider
   * @param userId - The user's unique identifier
   * @param provider - The social media provider
   * @param body - Message content
   * @returns Send result
   */
  async sendMessage(userId: string, provider: SupportedProvider, body: MessageBody): Promise<ConnectionResult> {
    const serviceMap = {
      facebook: () => this.facebookService.sendMessage(userId, body),
      twitter: () => this.twitterService.sendMessage(userId, body),
      instagram: () => ({ success: false, message: 'Messages not available for Instagram' }),
      linkedin: () => ({ success: false, message: 'Messages not available for LinkedIn' }),
    };

    const service = serviceMap[provider];
    if (!service) {
      return { success: false, message: 'Provider not supported' };
    }

    return service();
  }

  async getSocialStats(userId: string): Promise<ConnectionResult> {
    try {
      // 1. Get user's connected platforms
      const userAccounts = await this.prisma.account.findMany({
        where: { user_id: userId },
        select: { provider: true },
      });
      const connectedProviders = userAccounts.map(acc => acc.provider).filter(p => p) as string[];

      if (connectedProviders.length === 0) {
        return {
          success: true,
          data: { totalPosts: 0, totalReach: 0, engagementRate: 0, avgResponse: 0 },
          message: "No social platforms connected."
        };
      }

      // 2. Fetch posts linked to the user that were posted on their connected channels.
      const posts = await this.prisma.post.findMany({
        where: {
          task: {
            user_id: userId,
          },
          post_channels: {
            some: {
              channel: {
                name: {
                  in: connectedProviders,
                },
              },
            },
          },
        },
        include: {
          post_performances: true,
        },
      });

      const totalPosts = posts.length;
      let totalReach = 0;
      let totalEngagement = 0;

      posts.forEach((post) => {
        post.post_performances.forEach((perf) => {
          // Manually filter performances by provider
          if (connectedProviders.includes(perf.provider)) {
            totalReach += perf.reach ?? 0;
            totalEngagement += (perf.likes ?? 0) + (perf.comments ?? 0) + (perf.shares ?? 0);
          }
        });
      });

      const engagementRate = totalReach > 0 ? (totalEngagement / totalReach) * 100 : 0;

      // 3. Calculate Average Response Time from PostPerformance
      const responseAggregates = await this.prisma.postPerformance.aggregate({
        _avg: {
          avg_response_time_seconds: true,
        },
        where: {
          provider: {
            in: connectedProviders,
          },
          post: {
            task: {
              user_id: userId,
            },
          },
          avg_response_time_seconds: {
            not: null,
          },
        },
      });

      const avgResponseInSeconds = responseAggregates._avg.avg_response_time_seconds ?? 0;
      const avgResponseInHours = parseFloat((avgResponseInSeconds / 3600).toFixed(1));

      return {
        success: true,
        data: {
          totalPosts,
          totalReach,
          engagementRate: parseFloat(engagementRate.toFixed(2)),
          avgResponse: avgResponseInHours,
        },
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to fetch social stats: ${error.message}`,
      };
    }
  }

  // Private helper methods

  private validateConnectionInput(userId: string, credentials: CreateCredentialDto): void {
    if (!userId) {
      throw new BadRequestException('User ID is required');
    }
    if (!credentials.provider || !credentials.accessToken) {
      throw new BadRequestException('Provider and access token are required');
    }
    if (!SUPPORTED_PROVIDERS.includes(credentials.provider as SupportedProvider)) {
      throw new BadRequestException(`Unsupported provider: ${credentials.provider}`);
    }
  }

  private async validateUserExists(userId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
  }

  private async validateProviderAccount(credentials: CreateCredentialDto): Promise<void> {
    // Uncomment when provider validation is ready
    // await this.providerValidator.validateAccount(credentials.provider, credentials);
  }

  private buildAccountData(userId: string, credentials: CreateCredentialDto) {
    return {
      provider: credentials.provider,
      provider_account_id: credentials.providerAccountId || credentials.username || 'manual',
      api_key: credentials.apiKey,
      api_secret: credentials.apiSecret,
      access_token: credentials.accessToken,
      access_secret: credentials.accessSecret,
      refresh_token: credentials.refreshToken,
      user_id: userId,
      type: 'oauth',
      expires_at: new Date(Date.now() + TOKEN_EXPIRY_HOURS * MILLISECONDS_PER_HOUR),
    };
  }

  private async upsertAccount(accountData: any) {
    return this.prisma.account.upsert({
      where: {
        provider_provider_account_id: {
          provider: accountData.provider,
          provider_account_id: accountData.provider_account_id,
        },
      },
      update: accountData,
      create: accountData,
    });
  }

  private handleConnectionError(error: any, provider: string): ConnectionResult {
    console.error('Error in connectWithCredentials:', error);
    return {
      success: false,
      message: `Failed to connect ${provider}: ${error.message}`,
    };
  }

  private findAccountsForChannel(accounts: any[], channelName: string): any[] {
    return accounts.filter(
      (acc) => acc.provider?.toLowerCase() === channelName?.toLowerCase()
    );
  }

  private async getUserAccount(userId: string, provider: SupportedProvider) {
    const account = await this.prisma.account.findFirst({
      where: { user_id: userId, provider },
    });

    if (!account) {
      throw new NotFoundException(`${provider} not connected`);
    }

    return account;
  }

  private async fetchAllProviderPosts(userId: string) {
    return Promise.all([
      this.facebookService.fetchPosts(userId).catch(() => null),
      this.instagramService.fetchPosts(userId).catch(() => null),
      this.twitterService.fetchPosts(userId).catch(() => null),
      this.linkedinService.fetchPosts(userId).catch(() => null),
    ]);
  }

  private aggregateAndFormatPosts(providerResults: any[]): FormattedPost[] {
    const [fb, ig, tw, li] = providerResults;
    const allPosts = [
      ...this.formatFacebookPostsForPerformance(fb),
      ...this.formatInstagramPostsForPerformance(ig),
      ...this.formatTwitterPostsForPerformance(tw),
      ...this.formatLinkedInPostsForPerformance(li),
    ];

    // Sort by date descending
    return allPosts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  private safeArray(data: any): any[] {
    return (data && Array.isArray(data.data)) ? data.data : [];
  }

  private formatFacebookPostsForPerformance(postsData: any): FormattedPost[] {
    return this.safeArray(postsData).map((post: any) => {
      const insights = post.insights?.data || [];
      const reactions = insights.find((d: any) => d.name === 'post_reactions_by_type_total')?.values?.[0]?.value || {};
      const likes = reactions.like || 0;
      const comments = post.comments?.summary?.total_count || 0;
      const shares = post.shares?.count || 0;
      const reach = insights.find((d: any) => d.name === 'post_impressions')?.values?.[0]?.value || null;
      const engagementRate = reach ? (((likes + comments + shares) / reach) * 100).toFixed(1) + '%' : '0.0%';

      return {
        post: post.message,
        platform: 'Facebook',
        date: post.created_time,
        likes,
        comments,
        shares,
        reach,
        engagementRate,
        actions: {},
      };
    });
  }

  private formatInstagramPostsForPerformance(postsData: any): FormattedPost[] {
    return this.safeArray(postsData).map((post: any) => {
      const likes = post.like_count || 0;
      const comments = post.comments_count || 0;
      const shares = 0; // Not available
      const reach = null; // Not available
      const engagementRate = (((likes + comments) / 1000) * 100).toFixed(1) + '%';

      return {
        post: post.caption,
        platform: 'Instagram',
        date: post.timestamp,
        likes,
        comments,
        shares,
        reach,
        engagementRate,
        actions: {},
      };
    });
  }

  private formatTwitterPostsForPerformance(tweetsData: any): FormattedPost[] {
    // If tweetsData is { data: [...] }, use tweetsData.data
    const tweets = Array.isArray(tweetsData) ? tweetsData : (tweetsData?.data || []);
    return tweets.map((tweet: any) => {
      const metrics = tweet.public_metrics || {};
      const likes = metrics.like_count || 0;
      const comments = metrics.reply_count || 0;
      const shares = metrics.retweet_count || 0;
      const reach = null; // Not available
      const engagementRate = (((likes + comments + shares) / 1000) * 100).toFixed(1) + '%';

      return {
        post: tweet.text,
        platform: 'Twitter',
        date: tweet.created_at,
        likes,
        comments,
        shares,
        reach,
        engagementRate,
        actions: {},
      };
    });
  }

  private formatLinkedInPostsForPerformance(postsData: any): FormattedPost[] {
    return this.safeArray(postsData).map((post: any) => {
      const likes = post.likes || 0;
      const comments = post.comments || 0;
      const shares = post.shares || 0;
      const reach = post.reach || null;
      const engagementRate = reach ? (((likes + comments + shares) / reach) * 100).toFixed(1) + '%' : '0.0%';

      return {
        post: post.text,
        platform: 'LinkedIn',
        date: post.created,
        likes,
        comments,
        shares,
        reach,
        engagementRate,
        actions: {},
      };
    });
  }
}
