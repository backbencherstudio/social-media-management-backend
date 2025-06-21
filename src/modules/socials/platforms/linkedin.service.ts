import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import axios from 'axios';

@Injectable()
export class LinkedInService {
  constructor(private readonly prisma: PrismaService) {}

  async fetchPosts(userId: string) {
    const account = await this.prisma.account.findFirst({
      where: { user_id: userId, provider: 'linkedin' },
    });
    if (!account) throw new Error('LinkedIn not connected');

    const accessToken = account.access_token;
    const personUrn = `urn:li:person:${account.provider_account_id}`;

    const postsRes = await axios.get('https://api.linkedin.com/v2/shares', {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: {
        q: 'owners',
        owners: personUrn,
        sharesPerOwner: 10,
      },
    });
    return postsRes.data;
  }

  async getPages(accessToken: string) {
    try {
      const response = await axios.get('https://api.linkedin.com/v2/organizationalEntityAcls', {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: {
          q: 'roleAssignee',
          role: 'ADMINISTRATOR',
        },
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch LinkedIn pages: ${error.message}`);
    }
  }

  async getProfile(accessToken: string) {
    try {
      const response = await axios.get('https://api.linkedin.com/v2/me', {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: {
          projection: '(id,firstName,lastName,profilePicture(displayImage~:playableStreams),email-address)',
        },
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch LinkedIn profile: ${error.message}`);
    }
  }

  async getAnalytics(accessToken: string) {
    try {
      const response = await axios.get('https://api.linkedin.com/v2/me', {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: {
          projection: '(id,firstName,lastName,publicProfileUrl)',
        },
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch LinkedIn analytics: ${error.message}`);
    }
  }

  async testConnection(accessToken: string) {
    try {
      const response = await axios.get('https://api.linkedin.com/v2/me', {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: {
          projection: '(id,firstName,lastName)',
        },
      });
      return {
        connected: true,
        user: response.data,
        message: 'LinkedIn connection is working'
      };
    } catch (error) {
      return {
        connected: false,
        error: error.message,
        message: 'LinkedIn connection failed'
      };
    }
  }

  async getFollowerActivity(userId: string, start?: string, end?: string) {
    // Find the user's LinkedIn account
    const account = await this.prisma.account.findFirst({
      where: { user_id: userId, provider: 'linkedin' },
    });
    if (!account) return { success: false, message: 'LinkedIn not connected' };
    const personUrn = `urn:li:person:${account.provider_account_id}`;
    const accessToken = account.access_token;

    try {
      // Fetch recent shares
      const sharesRes = await axios.get('https://api.linkedin.com/v2/shares', {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: {
          q: 'owners',
          owners: personUrn,
          sharesPerOwner: 100,
          start: start,
          end: end,
        },
      });
      const shares = sharesRes.data.elements || [];

      // Aggregate engagement by day/hour
      const activity = Array(7).fill(0).map(() => Array(24).fill(0));
      for (const share of shares) {
        const date = new Date(share.created.time);
        const day = date.getUTCDay();
        const hour = date.getUTCHours();
        // LinkedIn does not provide detailed engagement, so just count the share as 1
        activity[day][hour] += 1;
      }
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
      return { success: false, message: error.response?.data?.message || error.message };
    }
  }
}
