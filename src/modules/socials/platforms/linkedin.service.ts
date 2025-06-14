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

/*
{
  "elements": [
    {
      "activity": "urn:li:activity:1234567890123456789",
      "actor": "urn:li:person:abcdef123456",
      "created": {
        "time": 1718000000000,
        "actor": "urn:li:person:abcdef123456"
      },
      "id": "urn:li:share:1234567890",
      "lastModified": {
        "time": 1718000010000,
        "actor": "urn:li:person:abcdef123456"
      },
      "text": {
        "text": "Excited to share my latest blog post on LinkedIn API integration!"
      },
      "visibility": {
        "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
      },
      "distribution": {
        "linkedInDistributionTarget": {}
      },
      "owner": "urn:li:person:abcdef123456"
    },
    {
      "activity": "urn:li:activity:2234567890123456789",
      "actor": "urn:li:person:abcdef123456",
      "created": {
        "time": 1717990000000,
        "actor": "urn:li:person:abcdef123456"
      },
      "id": "urn:li:share:2234567890",
      "text": {
        "text": "New project launched! 🚀 #dev #nestjs"
      },
      "owner": "urn:li:person:abcdef123456",
      "visibility": {
        "com.linkedin.ugc.MemberNetworkVisibility": "CONNECTIONS"
      },
      "distribution": {
        "linkedInDistributionTarget": {}
      }
    }
  ],
  "paging": {
    "count": 10,
    "start": 0,
    "links": []
  }
}

*/