import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import axios from 'axios';

@Injectable()
export class FacebookService {
  constructor(private readonly prisma: PrismaService) {}

  async fetchPosts(userId: string) {
    const account = await this.prisma.account.findFirst({
      where: { user_id: userId, provider: 'facebook' }
    });
    if (!account) throw new Error('Facebook not connected');

    const pageId = account.provider_account_id; // Facebook Page ID
    const accessToken = account.access_token;

    const response = await axios.get(
      `https://graph.facebook.com/v19.0/${pageId}/posts`,
      {
        params: {
          fields:
            'id,message,created_time,insights.metric(post_impressions,post_engaged_users,post_reactions_by_type_total),comments.summary(true),shares',
          access_token: accessToken,
        },
      }
    );

    return response.data;
  }

  async getPages(accessToken: string) {
    try {
      const response = await axios.get('https://graph.facebook.com/v19.0/me/accounts', {
        params: {
          access_token: accessToken,
          fields: 'id,name,access_token,category,fan_count,picture',
        },
      });
      return response.data.data;
    } catch (error) {
      throw new Error(`Failed to fetch Facebook pages: ${error.message}`);
    }
  }

  async getProfile(accessToken: string) {
    try {
      const response = await axios.get('https://graph.facebook.com/v19.0/me', {
        params: {
          access_token: accessToken,
          fields: 'id,name,email,picture.type(large),link',
        },
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch Facebook profile: ${error.message}`);
    }
  }

  async getAnalytics(accessToken: string) {
    try {
      const response = await axios.get('https://graph.facebook.com/v19.0/me/insights', {
        params: {
          access_token: accessToken,
          metric: 'page_impressions,page_engaged_users,page_fan_adds',
          period: 'day',
          since: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // Last 30 days
        },
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch Facebook analytics: ${error.message}`);
    }
  }

  async testConnection(accessToken: string) {
    try {
      const response = await axios.get('https://graph.facebook.com/v19.0/me', {
        params: {
          access_token: accessToken,
          fields: 'id,name',
        },
      });
      return {
        connected: true,
        user: response.data,
        message: 'Facebook connection is working'
      };
    } catch (error) {
      return {
        connected: false,
        error: error.message,
        message: 'Facebook connection failed'
      };
    }
  }

  async getFollowerActivity(userId: string, start?: string, end?: string) {
    // Find the user's Facebook account
    const account = await this.prisma.account.findFirst({
      where: { user_id: userId, provider: 'facebook' },
    });
    if (!account) return { success: false, message: 'Facebook not connected' };
    const pageId = account.provider_account_id;
    const accessToken = account.access_token;

    try {
      // Fetch page_fans_online_per_day (array of 7 arrays, each with 24 values)
      const insightsRes = await axios.get(`https://graph.facebook.com/v19.0/${pageId}/insights/page_fans_online_per_day`, {
        params: {
          access_token: accessToken,
          since: start,
          until: end,
        },
      });
      // Format for heatmap: [ [hour0, hour1, ...], ... ]
      const data = insightsRes.data.data?.[0]?.values?.[0]?.value;
      // Facebook returns an object with keys 0-6 (Sun-Sat), each an array of 24 numbers
      const activity = [0,1,2,3,4,5,6].map(day => data?.[day] || Array(24).fill(0));
      return {
        success: true,
        data: {
          activity,
          labels: {
            days: ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'],
            hours: Array.from({length:24}, (_,i)=>i)
          }
        }
      };
    } catch (error) {
      return { success: false, message: error.response?.data?.error?.message || error.message };
    }
  }
}
