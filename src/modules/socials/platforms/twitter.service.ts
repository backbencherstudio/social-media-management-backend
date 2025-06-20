import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import axios from 'axios';
import { Account } from '@prisma/client';
import { createTwitterClient } from './twitter.client';

@Injectable()
export class TwitterService {
  constructor(private readonly prisma: PrismaService) { }

  async fetchPosts(userId: string) {
    const account = await this.prisma.account.findFirst({
      where: { user_id: userId, provider: 'twitter' },
    }) as Account | null;
    if (!account) throw new Error('Twitter not connected');
    if (!account.api_key || !account.api_secret || !account.access_token || !account.access_secret) {
      throw new Error('Missing Twitter API credentials (api_key, api_secret, access_token, access_secret) in account model');
    }
    const client = createTwitterClient(account);
    // Get user by username
    const user = await client.v2.userByUsername(account.provider_account_id);
    if (!user?.data?.id) throw new Error('Could not find Twitter user');
    // Fetch tweets
    const tweets = await client.v2.userTimeline(user.data.id, {
      'tweet.fields': ['created_at', 'public_metrics', 'author_id'],
      max_results: 10,
    });
    return tweets.data;
  }

  async getProfile(accessToken: string, provider_account_id: string) {
    // Find the account by provider_account_id
    const account = await this.prisma.account.findFirst({
      where: { provider: 'twitter', provider_account_id },
    }) as Account | null;
    if (!account) throw new Error('Twitter not connected');
    if (!account.api_key || !account.api_secret || !account.access_token || !account.access_secret) {
      throw new Error('Missing Twitter API credentials (api_key, api_secret, access_token, access_secret) in account model');
    }
    const client = createTwitterClient(account);
    // Get user profile by username
    const user = await client.v2.userByUsername(provider_account_id, {
      'user.fields': ['id', 'name', 'username', 'profile_image_url', 'public_metrics', 'description', 'created_at'],
    });
    return user.data;
  }

  async getAnalytics(accessToken: string, provider_account_id: string) {
    // Find the account by provider_account_id
    const account = await this.prisma.account.findFirst({
      where: { provider: 'twitter', provider_account_id },
    }) as Account | null;
    if (!account) throw new Error('Twitter not connected');
    if (!account.api_key || !account.api_secret || !account.access_token || !account.access_secret) {
      throw new Error('Missing Twitter API credentials (api_key, api_secret, access_token, access_secret) in account model');
    }
    const client = createTwitterClient(account);
    // Get user analytics (public_metrics)
    const user = await client.v2.userByUsername(provider_account_id, {
      'user.fields': ['public_metrics'],
    });
    return user.data;
  }

  async testConnection(accessToken: string) {
    try {
      // Test with a simple search endpoint
      const response = await axios.get(
        'https://api.twitter.com/2/tweets/search/recent',
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          params: {
            query: 'test',
            max_results: 1,
          },
        },
      );

      console.log('Test connection response:', response.data);

      return {
        connected: true,
        type: 'Bearer Token (Public Access)',
        message: 'Twitter Bearer token is working',
        data: response.data,
      };
    } catch (error) {
      console.error(
        'Test connection error:',
        error.response?.data || error.message,
      );
      return {
        connected: false,
        error: error.message,
        message: 'Twitter connection failed',
        details: error.response?.data,
      };
    }
  }

  async getFollowerActivity(userId: string, start?: string, end?: string) {
    const account = await this.prisma.account.findFirst({
      where: { user_id: userId, provider: 'twitter' },
    }) as Account | null;
    if (!account) return { success: false, message: 'Twitter not connected' };
    if (!account.api_key || !account.api_secret || !account.access_token || !account.access_secret) {
      return { success: false, message: 'Missing Twitter API credentials (api_key, api_secret, access_token, access_secret) in account model' };
    }
    const client = createTwitterClient(account);
    // Get user by username
    const user = await client.v2.userByUsername(account.provider_account_id);
    if (!user?.data?.id) return { success: false, message: 'Could not find Twitter user' };
    // Fetch recent tweets
    const tweetsRes = await client.v2.userTimeline(user.data.id, {
      'tweet.fields': ['created_at', 'public_metrics'],
      max_results: 100,
      start_time: start,
      end_time: end,
    });
    const tweets = tweetsRes.data || [];
    // Aggregate engagement by day/hour
    const activity = Array(7).fill(0).map(() => Array(24).fill(0));
    // Ensure tweets is always an array
    const tweetArray = Array.isArray(tweets) ? tweets : (tweets?.data ?? []);
    for (const tweet of tweetArray) {
      const date = new Date(tweet.created_at);
      const day = date.getUTCDay(); // 0=Sun
      const hour = date.getUTCHours();
      const engagement =
        (tweet.public_metrics?.like_count || 0) +
        (tweet.public_metrics?.retweet_count || 0) +
        (tweet.public_metrics?.reply_count || 0);
      activity[day][hour] += engagement;
    }
    return {
      success: true,
      data: {
        activity,
        labels: {
          days: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
          hours: Array.from({ length: 24 }, (_, i) => i),
        },
      },
    };
  }

  async publishPost(
    userId: string,
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
    try {
      // Get user's Twitter account
      const account = await this.prisma.account.findFirst({
        where: { user_id: userId, provider: 'twitter' },
      }) as Account | null;

      if (!account) {
        return {
          success: false,
          message: 'Twitter account not connected for this user',
        };
      }

      // Ensure all required credentials are present
      if (!account.api_key || !account.api_secret || !account.access_token || !account.access_secret) {
        return {
          success: false,
          message: 'Missing Twitter API credentials (api_key, api_secret, access_token, access_secret) in account model',
        };
      }

      // Prepare tweet text with hashtags
      let tweetText = postData.content;
      if (postData.hashtags && postData.hashtags.length > 0) {
        const hashtagString = postData.hashtags
          .map((tag) => `#${tag.replace('#', '')}`)
          .join(' ');
        tweetText += ` ${hashtagString}`;
      }

      // Check if text exceeds Twitter's limit (280 characters)
      if (tweetText.length > 280) {
        return {
          success: false,
          message: 'Tweet content exceeds 280 character limit',
        };
      }

      // Use twitter-api-v2 for posting, using credentials from the account model
      const client = createTwitterClient(account);

      const tweet = await client.v2.tweet(tweetText);

      return {
        success: true,
        message: 'Post published to Twitter successfully',
        data: tweet,
      };
    } catch (error) {
      console.error('Error publishing to Twitter:', error);
      return {
        success: false,
        message: `Failed to publish to Twitter: ${error.message}`,
      };
    }
  }

  // Fetch Twitter DMs for the authenticated user
  async getMessages(userId: string) {
    const account = await this.prisma.account.findFirst({
      where: { user_id: userId, provider: 'twitter' },
    });
    if (!account) return { success: false, message: 'Twitter not connected' };

    const accessToken = account.access_token;

    // Twitter API v2 does NOT support DMs for most apps.
    // If you have access, use the correct endpoint. Otherwise, this is a placeholder.
    // Replace with the correct endpoint if you have access to Twitter's DM API.
    try {
      const response = await axios.get(
        'https://api.twitter.com/2/dm_conversations/with', // <-- Replace with actual endpoint if you have access
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          // params: { ... }
        }
      );

      // Map to unified format
      const data = (response.data.data || []).map(msg => ({
        id: msg.id,
        sender: { name: msg.sender_id, avatar: null }, // You may need to fetch user info for avatar
        text: msg.text,
        platform: 'Twitter',
        type: 'dm',
        timestamp: msg.created_at,
      }));

      return { success: true, data };
    } catch (error) {
      return { success: false, message: 'Twitter DM API not available or not authorized.' };
    }
  }

  // Send a Twitter DM reply
  async sendMessage(userId: string, body: { conversationId: string; text: string }) {
    const account = await this.prisma.account.findFirst({
      where: { user_id: userId, provider: 'twitter' },
    });
    if (!account) return { success: false, message: 'Twitter not connected' };

    const accessToken = account.access_token;

    // Twitter API v2 does NOT support DMs for most apps.
    // If you have access, use the correct endpoint. Otherwise, this is a placeholder.
    try {
      await axios.post(
        'https://api.twitter.com/2/dm_conversations/with', // <-- Replace with actual endpoint if you have access
        {
          conversation_id: body.conversationId,
          text: body.text,
        },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      return { success: true, message: 'Message sent' };
    } catch (error) {
      return { success: false, message: 'Twitter DM API not available or not authorized.' };
    }
  }
}
