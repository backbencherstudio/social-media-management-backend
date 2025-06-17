import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { FacebookService } from './platforms/facebook.service';
import { InstagramService } from './platforms/instagram.service';
import { TwitterService } from './platforms/twitter.service';
import { LinkedInService } from './platforms/linkedin.service';
import { CreateCredentialDto } from './dto/createCredentialDto';

@Injectable()
export class SocialsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly facebookService: FacebookService,
    private readonly instagramService: InstagramService,
    private readonly twitterService: TwitterService,
    private readonly linkedinService: LinkedInService,
  ) {}

  async getConnections(userId: string) {
    const channels = await this.prisma.channel.findMany();
    const accounts = await this.prisma.account.findMany({
      where: { user_id: userId },
    });

    return {
      success: true,
      data: channels.map((channel) => {
        const account = accounts.find(
          (acc) => acc.provider?.toLowerCase() === channel.name?.toLowerCase(),
        );
        return {
          name: channel.name,
          status: account ? 'Connected' : 'Not Connected',
          details: account ? { username: account.provider_account_id } : null,
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
      case 'twitter':
        return {
          success: true,
          data: await this.twitterService.fetchPosts(userId),
        };
      case 'linkedin':
        return {
          success: true,
          data: await this.linkedinService.fetchPosts(userId),
        };
      default:
        return { success: false, message: 'Provider not supported' };
    }
  }

  // New methods for manual credential management
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
}
