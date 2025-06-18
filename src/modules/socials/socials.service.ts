import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { FacebookService } from './platforms/facebook.service';
import { InstagramService } from './platforms/instagram.service';
import { TwitterService } from './platforms/twitter.service';
import { LinkedInService } from './platforms/linkedin.service';
import { CreateCredentialDto } from './dto/createCredentialDto';
import { ProviderValidatorService } from './providers/provider-validator.service';

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

  async connectWithCredentials(
    userId: string,
    credentials: CreateCredentialDto,
  ) {
    console.log(
      `Connecting with credentials for ${credentials.provider}...`,
      credentials,
    );
    console.log('UserId received:', userId);

    if (!credentials.provider || !credentials.accessToken) {
      return {
        success: false,
        message: 'Provider and access token are required',
      };
    }

    if (!userId) {
      return {
        success: false,
        message: 'user id is required',
      };
    }

    try {
      // First, verify the user exists
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return {
          success: false,
          message: 'User not found',
        };
      }

      // Validate provider account using the new service
      try {
        await this.providerValidator.validateAccount(credentials.provider, credentials);
      } catch (err) {
        return {
          success: false,
          message: `Invalid provider account: ${err?.message || 'Unknown error'}`,
        };
      }

      const accountData = {
        provider: credentials.provider,
        provider_account_id:
          credentials.providerAccountId || credentials.username || 'manual',
        access_token: credentials.accessToken,
        refresh_token: credentials.refreshToken,
        user_id: userId,
        type: 'oauth',
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      };

      console.log('Account data to upsert:', accountData);

      const account = await this.prisma.account.upsert({
        where: {
          provider_provider_account_id: {
            provider: credentials.provider,
            provider_account_id: accountData.provider_account_id,
          },
        },
        update: accountData,
        create: accountData,
      });

      return {
        success: true,
        message: `${credentials.provider} connected successfully`,
        data: { accountId: account.id, provider: account.provider },
      };
    } catch (error) {
      console.error('Error in connectWithCredentials:', error);
      return {
        success: false,
        message: `Failed to connect ${credentials.provider}: ${error.message}`,
      };
    }
  }

  async getConnections(userId: string) {
    const channels = await this.prisma.channel.findMany();
    const accounts = await this.prisma.account.findMany({
      where: { user_id: userId },
    });

    return {
      success: true,
      data: channels.map((channel) => {
        // Find all accounts for this provider/channel
        const matchedAccounts = accounts.filter(
          (acc) => acc.provider?.toLowerCase() === channel.name?.toLowerCase()
        );
        return {
          name: channel.name,
          status: matchedAccounts.length > 0 ? 'Connected' : 'Not Connected',
          details: matchedAccounts.length > 0
            ? matchedAccounts.map(acc => ({ username: acc.provider_account_id }))
            : null,
        };
      }),
    };
  }

  async disconnect(userId: string, provider: string) {
    await this.prisma.account.deleteMany({
      where: { user_id: userId, provider },
    });
    return { success: true, message: `${provider} disconnected` };
  }

  // Utility: Safely get array from API response
  private safeArray(data: any): any[] {
    return (data && Array.isArray(data.data)) ? data.data : [];
  }

  // --- Formatting Helpers for Recent Posts Performance ---

  // Facebook
  private formatFacebookPostsForPerformance(postsData: any): any[] {
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

  // Instagram
  private formatInstagramPostsForPerformance(postsData: any): any[] {
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

  // Twitter
  private formatTwitterPostsForPerformance(tweetsData: any): any[] {
    return this.safeArray(tweetsData).map((tweet: any) => {
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

  // LinkedIn
  private formatLinkedInPostsForPerformance(postsData: any): any[] {
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

  // --- Fetch and format posts from all providers ---
  async fetchPostsPerformanceAllProviders(userId: string) {
    const [fb, ig, tw, li] = await Promise.all([
      this.facebookService.fetchPosts(userId).catch(() => null),
      this.instagramService.fetchPosts(userId).catch(() => null),
      this.twitterService.fetchPosts(userId).catch(() => null),
      this.linkedinService.fetchPosts(userId).catch(() => null),
    ]);
    const allPosts = [
      ...this.formatFacebookPostsForPerformance(fb),
      ...this.formatInstagramPostsForPerformance(ig),
      ...this.formatTwitterPostsForPerformance(tw),
      ...this.formatLinkedInPostsForPerformance(li),
    ];
    // Sort by date descending
    allPosts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return { success: true, data: allPosts };
  }

  async fetchPostsByProvider(userId: string, provider: string) {
    switch (provider) {
      case 'facebook':
        return {
          success: true,
          data: await this.facebookService.fetchPosts(userId),
        };
      case 'instagram':
        return {
          success: true,
          data: await this.instagramService.fetchPosts(userId),
        };
      case 'twitter': {
        const tweetsData = await this.twitterService.fetchPosts(userId);
        return {
          success: true,
          data: this.formatTwitterPostsForPerformance(tweetsData),
        };
      }
      case 'linkedin':
        return {
          success: true,
          data: await this.linkedinService.fetchPosts(userId),
        };
      default:
        return { success: false, message: 'Provider not supported' };
    }
  }

  async getPages(userId: string, provider: string) {
    try {
      const account = await this.prisma.account.findFirst({
        where: { user_id: userId, provider },
      });

      if (!account) {
        return { success: false, message: `${provider} not connected` };
      }

      switch (provider) {
        case 'facebook':
          return {
            success: true,
            data: await this.facebookService.getPages(account.access_token),
          };
        case 'instagram':
          return {
            success: true,
            data: await this.instagramService.getPages(account.access_token),
          };
        case 'linkedin':
          return {
            success: true,
            data: await this.linkedinService.getPages(account.access_token),
          };

        default:
          return {
            success: false,
            message: 'Pages not available for this provider',
          };
      }
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  async getProfile(userId: string, provider: string) {
    try {
      const account = await this.prisma.account.findFirst({
        where: { user_id: userId, provider },
      });

      console.log('Account found:', account);

      if (!account) {
        return { success: false, message: `${provider} not connected` };
      }

      switch (provider) {
        case 'facebook':
          return {
            success: true,
            data: await this.facebookService.getProfile(account.access_token),
          };
        case 'instagram':
          return {
            success: true,
            data: await this.instagramService.getProfile(account.access_token),
          };
        case 'twitter':
          return {
            success: true,
            data: await this.twitterService.getProfile(
              account.access_token,
              account.provider_account_id,
            ),
          };
        case 'linkedin':
          return {
            success: true,
            data: await this.linkedinService.getProfile(account.access_token),
          };
        default:
          return {
            success: false,
            message: 'Profile not available for this provider',
          };
      }
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  async getAnalytics(userId: string, provider: string) {
    try {
      const account = await this.prisma.account.findFirst({
        where: { user_id: userId, provider },
      });

      if (!account) {
        return { success: false, message: `${provider} not connected` };
      }

      switch (provider) {
        case 'facebook':
          return {
            success: true,
            data: await this.facebookService.getAnalytics(account.access_token),
          };
        case 'instagram':
          return {
            success: true,
            data: await this.instagramService.getAnalytics(
              account.access_token,
            ),
          };
        case 'twitter':
          return {
            success: true,
            data: await this.twitterService.getAnalytics(
              account.access_token,
              account.provider_account_id,
            ),
          };
        case 'linkedin':
          return {
            success: true,
            data: await this.linkedinService.getAnalytics(account.access_token),
          };
        default:
          return {
            success: false,
            message: 'Analytics not available for this provider',
          };
      }
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  async updateCredentials(
    userId: string,
    provider: string,
    credentials: {
      accessToken: string;
      refreshToken?: string;
      providerAccountId?: string;
    },
  ) {
    try {
      const account = await this.prisma.account.findFirst({
        where: { user_id: userId, provider },
      });

      if (!account) {
        return { success: false, message: `${provider} not connected` };
      }

      await this.prisma.account.update({
        where: { id: account.id },
        data: {
          access_token: credentials.accessToken,
          refresh_token: credentials.refreshToken,
          provider_account_id:
            credentials.providerAccountId || account.provider_account_id,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });

      return {
        success: true,
        message: `${provider} credentials updated successfully`,
      };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  async testConnection(userId: string, provider: string) {
    try {
      const account = await this.prisma.account.findFirst({
        where: { user_id: userId, provider },
      });

      if (!account) {
        return { success: false, message: `${provider} not connected` };
      }

      // Test the connection by making a simple API call
      switch (provider) {
        case 'facebook':
          const fbTest = await this.facebookService.testConnection(
            account.access_token,
          );
          return { success: true, data: fbTest };
        case 'instagram':
          const igTest = await this.instagramService.testConnection(
            account.access_token,
          );
          return { success: true, data: igTest };
        case 'twitter':
          const twTest = await this.twitterService.testConnection(
            account.access_token,
          );
          return { success: true, data: twTest };
        case 'linkedin':
          const liTest = await this.linkedinService.testConnection(
            account.access_token,
          );
          return { success: true, data: liTest };
        default:
          return {
            success: false,
            message: 'Provider not supported for testing',
          };
      }
    } catch (error) {
      return {
        success: false,
        message: `Connection test failed: ${error.message}`,
      };
    }
  }

  async getFollowerActivity(
    userId: string,
    provider: string,
    start?: string,
    end?: string,
  ) {
    switch (provider) {
      case 'facebook':
        return this.facebookService.getFollowerActivity(userId, start, end);
      case 'instagram':
        return this.instagramService.getFollowerActivity(userId, start, end);
      case 'twitter':
        return this.twitterService.getFollowerActivity(userId, start, end);
      case 'linkedin':
        return this.linkedinService.getFollowerActivity(userId, start, end);
      default:
        return { success: false, message: 'Provider not supported' };
    }
  }

  async publishPost(
    userId: string,
    provider: string,
    postData: {
      content: string;
      hashtags?: string[];
      mediaFiles?: Array<{
        name: string;
        type: string;
        file_path: string;
      }>;
    },
  ) {
    switch (provider) {
      case 'twitter':
        return this.twitterService.publishPost(userId, postData);
      case 'facebook':
        // TODO: Implement Facebook posting
        return { success: false, message: 'Facebook posting not implemented yet' };
      case 'instagram':
        // TODO: Implement Instagram posting
        return { success: false, message: 'Instagram posting not implemented yet' };
      case 'linkedin':
        // TODO: Implement LinkedIn posting
        return { success: false, message: 'LinkedIn posting not implemented yet' };
      default:
        return { success: false, message: 'Provider not supported for posting' };
    }
  }

  async getAudienceDemographics(userId: string, provider: string) {
    const account = await this.prisma.account.findFirst({
      where: { user_id: userId, provider },
    });
    if (!account) return { success: false, message: `${provider} not connected` };

    switch (provider) {
      case 'facebook':
        return this.facebookService.getAudienceDemographics(account.access_token, account.provider_account_id);
      case 'instagram':
        return this.instagramService.getAudienceDemographics(account.access_token, account.provider_account_id);
      // Add for LinkedIn if needed
      default:
        return { success: false, message: 'Demographics not available for this provider' };
    }
  }

  async getMessages(userId: string, provider: string) {
    switch (provider) {
      case 'facebook':
        return this.facebookService.getMessages(userId);
      case 'twitter':
        return this.twitterService.getMessages(userId);
      // case 'instagram':
      //   return this.instagramService.getMessages(userId);
      // case 'linkedin':
      //   return this.linkedinService.getMessages(userId);
      default:
        return { success: false, message: 'Provider not supported' };
    }
  }

  async sendMessage(userId: string, provider: string, body: { conversationId: string; text: string }) {
    switch (provider) {
      case 'facebook':
        return this.facebookService.sendMessage(userId, body);
      case 'twitter':
        return this.twitterService.sendMessage(userId, body);
      // case 'instagram':
      //   return this.instagramService.sendMessage(userId, body);
      // case 'linkedin':
      //   return this.linkedinService.sendMessage(userId, body);
      default:
        return { success: false, message: 'Provider not supported' };
    }
  }
}
