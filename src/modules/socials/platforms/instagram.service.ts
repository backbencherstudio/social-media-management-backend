import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import axios from 'axios';

@Injectable()
export class InstagramService {
  constructor(private readonly prisma: PrismaService) { }

  async fetchPosts(userId: string) {
    const account = await this.prisma.account.findFirst({
      where: { user_id: userId, provider: 'instagram' },
    });
    if (!account) throw new Error('Instagram not connected');

    const igUserId = account.provider_account_id;
    const accessToken = account.access_token;

    const postsRes = await axios.get(`https://graph.facebook.com/v19.0/${igUserId}/media`, {
      params: {
        fields:
          'id,caption,media_type,media_url,permalink,thumbnail_url,timestamp,username,comments_count,like_count',
        access_token: accessToken,
      },
    });
    return postsRes.data;
  }

  async getPages(accessToken: string) {
    try {
      // Instagram Business accounts can be accessed through Facebook Graph API
      const response = await axios.get('https://graph.facebook.com/v19.0/me/accounts', {
        params: {
          access_token: accessToken,
          fields: 'instagram_business_account{id,username,name,profile_picture_url,followers_count,media_count}',
        },
      });
      return response.data.data;
    } catch (error) {
      throw new Error(`Failed to fetch Instagram pages: ${error.message}`);
    }
  }

  async getProfile(accessToken: string) {
    try {
      const response = await axios.get('https://graph.facebook.com/v19.0/me', {
        params: {
          access_token: accessToken,
          fields: 'instagram_business_account{id,username,name,profile_picture_url,followers_count,media_count,website}',
        },
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch Instagram profile: ${error.message}`);
    }
  }

  async getAnalytics(accessToken: string) {
    try {
      const response = await axios.get('https://graph.facebook.com/v19.0/me/insights', {
        params: {
          access_token: accessToken,
          metric: 'impressions,reach,profile_views',
          period: 'day',
          since: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // Last 30 days
        },
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch Instagram analytics: ${error.message}`);
    }
  }

  async testConnection(accessToken: string) {
    try {
      const response = await axios.get('https://graph.facebook.com/v19.0/me', {
        params: {
          access_token: accessToken,
          fields: 'id,name,instagram_business_account{id,username}',
        },
      });
      return {
        connected: true,
        user: response.data,
        message: 'Instagram connection is working'
      };
    } catch (error) {
      return {
        connected: false,
        error: error.message,
        message: 'Instagram connection failed'
      };
    }
  }

  async getFollowerActivity(userId: string, start?: string, end?: string) {
    // Find the user's Instagram account
    const account = await this.prisma.account.findFirst({
      where: { user_id: userId, provider: 'instagram' },
    });
    if (!account) return { success: false, message: 'Instagram not connected' };
    const igUserId = account.provider_account_id;
    const accessToken = account.access_token;

    try {
      // Instagram business insights via Facebook Graph API
      // Endpoint: /{ig-user-id}/insights?metric=audience_online
      const insightsRes = await axios.get(`https://graph.facebook.com/v19.0/${igUserId}/insights`, {
        params: {
          metric: 'audience_online',
          access_token: accessToken,
          since: start,
          until: end,
        },
      });
      // Format for heatmap: [ [hour0, hour1, ...], ... ]
      const data = insightsRes.data.data?.[0]?.values?.[0]?.value;
      // Instagram returns an object with keys 0-6 (Sun-Sat), each an array of 24 numbers
      const activity = [0, 1, 2, 3, 4, 5, 6].map(day => data?.[day] || Array(24).fill(0));
      return {
        success: true,
        data: {
          activity,
          labels: {
            days: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
            hours: Array.from({ length: 24 }, (_, i) => i)
          }
        }
      };
    } catch (error) {
      return { success: false, message: error.response?.data?.error?.message || error.message };
    }
  }
  async getAudienceDemographics(accessToken: string, pageId: string) {
    const response = await axios.get(
      `https://graph.facebook.com/v19.0/${pageId}/insights`,
      {
        params: {
          metric: 'audience_gender_age,audience_country',
          access_token: accessToken,
        },
      }
    );
    return response.data;
  }
}
