import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import axios from 'axios';

@Injectable()
export class TwitterService {
  constructor(private readonly prisma: PrismaService) { }

  async fetchPosts(userId: string) {
    console.log("user id : -----------------", userId)
    const account = await this.prisma.account.findFirst({
      where: { user_id: userId, provider: 'twitter' },
    });
    if (!account) throw new Error('Twitter not connected');
    console.log("account --------------", account)
    
    const twitterUserId = account.provider_account_id;
    const accessToken = account.access_token;
    const username = account.provider_account_id; // This should be the username

    console.log("Fetching tweets for username:", username);
    console.log("Using access token:", accessToken);

    try {
      // First, get the user ID from username
      const userResponse = await axios.get(`https://api.twitter.com/2/users/by/username/${username}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      console.log("User response:", userResponse.data);
      
      if (!userResponse.data.data || !userResponse.data.data.id) {
        throw new Error('Could not find Twitter user');
      }

      const userId = userResponse.data.data.id;
      console.log("Twitter user ID:", userId);

      // Now get tweets using the user ID
      const tweetsRes = await axios.get(`https://api.twitter.com/2/users/${userId}/tweets`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: {
          'tweet.fields': 'created_at,public_metrics,author_id',
          'max_results': 10,
        },
      });

      console.log("Tweets response:", tweetsRes.data);
      return tweetsRes.data;
    } catch (error) {
      console.error("Twitter API Error:", error.response?.data || error.message);
      console.error("Error status:", error.response?.status);
      console.error("Error URL:", error.config?.url);
      
      if (error.response?.status === 404) {
        throw new Error(`Twitter user '${username}' not found or account is private`);
      } else if (error.response?.status === 403) {
        throw new Error('Twitter API access denied. Check your API permissions.');
      } else if (error.response?.status === 401) {
        throw new Error('Twitter API authentication failed. Check your access token.');
      } else {
        throw new Error(`Twitter API error: ${error.response?.data?.detail || error.message}`);
      }
    }
  }

  async getProfile(accessToken: string) {
    try {
      console.log('Fetching Twitter profile with access token:', accessToken);
      
      // Use the username from the stored account
      const response = await axios.get('https://api.twitter.com/2/users/by/username/nirob844', {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: {
          'user.fields': 'id,name,username,profile_image_url,public_metrics,description,created_at',
        },
      });
      
      console.log("Profile response:", response.data);
      return response.data;
    } catch (error) {
      console.error('Twitter API Error:', error.response?.data || error.message);
      throw new Error(`Failed to fetch Twitter profile: ${error.message}`);
    }
  }

  async getAnalytics(accessToken: string) {
    try {
      const response = await axios.get('https://api.twitter.com/2/users/by/username/nirob844', {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: {
          'user.fields': 'public_metrics',
        },
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch Twitter analytics: ${error.message}`);
    }
  }

  async testConnection(accessToken: string) {
    try {
      // Test with a simple search endpoint
      const response = await axios.get('https://api.twitter.com/2/tweets/search/recent', {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: {
          query: 'test',
          max_results: 1,
        },
      });
      
      console.log("Test connection response:", response.data);
      
      return {
        connected: true,
        type: 'Bearer Token (Public Access)',
        message: 'Twitter Bearer token is working',
        data: response.data
      };
    } catch (error) {
      console.error("Test connection error:", error.response?.data || error.message);
      return {
        connected: false,
        error: error.message,
        message: 'Twitter connection failed',
        details: error.response?.data
      };
    }
  }

  async getFollowerActivity(userId: string, start?: string, end?: string) {
    // Find the user's Twitter account
    const account = await this.prisma.account.findFirst({
      where: { user_id: userId, provider: 'twitter' },
    });
    if (!account) return { success: false, message: 'Twitter not connected' };
    const username = account.provider_account_id;
    const accessToken = account.access_token;

    try {
      // Get user ID from username
      const userResponse = await axios.get(`https://api.twitter.com/2/users/by/username/${username}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!userResponse.data.data || !userResponse.data.data.id) {
        throw new Error('Could not find Twitter user');
      }
      const twitterUserId = userResponse.data.data.id;

      // Fetch recent tweets
      const tweetsRes = await axios.get(`https://api.twitter.com/2/users/${twitterUserId}/tweets`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: {
          'tweet.fields': 'created_at,public_metrics',
          max_results: 100,
          start_time: start,
          end_time: end,
        },
      });
      const tweets = tweetsRes.data.data || [];

      // Aggregate engagement by day/hour
      const activity = Array(7).fill(0).map(() => Array(24).fill(0));
      for (const tweet of tweets) {
        const date = new Date(tweet.created_at);
        const day = date.getUTCDay(); // 0=Sun
        const hour = date.getUTCHours();
        const engagement = (tweet.public_metrics?.like_count || 0) + (tweet.public_metrics?.retweet_count || 0) + (tweet.public_metrics?.reply_count || 0);
        activity[day][hour] += engagement;
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
      return { success: false, message: error.response?.data?.detail || error.message };
    }
  }
}
