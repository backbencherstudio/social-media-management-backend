import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import axios from 'axios';
import { Account } from '@prisma/client';
import { createTwitterClient } from './twitter.client';

@Injectable()
export class TwitterService {
  constructor(private readonly prisma: PrismaService) { }

  async fetchPosts(userId: string) {
    try {
      const account = await this.prisma.account.findFirst({
        where: { user_id: userId, provider: 'twitter' },
      }) as Account | null;

      if (!account) {
        throw new Error('Twitter not connected');
      }

      const client = createTwitterClient(account);

      // Use the provider_account_id directly as user ID (it's already the Twitter user ID)
      const twitterUserId = account.provider_account_id;

      // Fetch tweets directly using the user ID
      const tweetsResponse = await client.v2.userTimeline(twitterUserId, {
        'tweet.fields': ['created_at', 'public_metrics', 'author_id', 'text'],
        'exclude': ['retweets', 'replies'], // Exclude retweets and replies
        max_results: 10,
      });

      const tweets = tweetsResponse.data?.data || [];

      // Transform tweets to match expected format
      const transformedTweets = Array.isArray(tweets) ? tweets.map(tweet => ({
        id: tweet.id,
        text: tweet.text,
        created_at: tweet.created_at,
        author_id: tweet.author_id,
        public_metrics: tweet.public_metrics || {},
        platform: 'twitter',
      })) : [];

      return {
        success: true,
        data: transformedTweets,
        meta: tweetsResponse.meta,
        count: transformedTweets.length,
      };
    } catch (error) {
      console.error('Error fetching Twitter posts:', error);
      return {
        success: false,
        message: `Failed to fetch twitter posts: ${error.message}`,
        error: error.response?.data || error.message,
      };
    }
  }

  async getProfile(accessToken: string, provider_account_id: string) {
    // Find the account by provider_account_id
    const account = await this.prisma.account.findFirst({
      where: { provider: 'twitter', provider_account_id },
    }) as Account | null;
    if (!account) throw new Error('Twitter not connected');

    const client = createTwitterClient(account);

    // Use the provider_account_id directly as user ID
    const user = await client.v2.user(provider_account_id, {
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

    const client = createTwitterClient(account);

    // Use the provider_account_id directly as user ID
    const user = await client.v2.user(provider_account_id, {
      'user.fields': ['public_metrics'],
    });
    return user.data;
  }

  async getFollowerActivity(userId: string, start?: string, end?: string) {
    const account = await this.prisma.account.findFirst({
      where: { user_id: userId, provider: 'twitter' },
    }) as Account | null;
    if (!account) return { success: false, message: 'Twitter not connected' };

    const client = createTwitterClient(account);

    // Use the provider_account_id directly as user ID
    const twitterUserId = account.provider_account_id;

    // Fetch recent tweets
    const tweetsRes = await client.v2.userTimeline(twitterUserId, {
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

  // Fetch performance metrics for a specific tweet by ID
  async fetchPostPerformance(tweetId: string) {
    try {
      // Find any account to use for authentication (since tweetId is global)
      const account = await this.prisma.account.findFirst({
        where: { provider: 'twitter' },
      });
      if (!account) throw new Error('No Twitter account available');
      const client = createTwitterClient(account);
      const tweet = await client.v2.singleTweet(tweetId, {
        'tweet.fields': ['public_metrics'],
      });
      const metrics: any = tweet.data?.public_metrics || {};
      return {
        likes: metrics?.like_count ?? 0,
        comments: metrics?.reply_count ?? 0,
        shares: metrics?.retweet_count ?? 0,
        reach: null, // Twitter API does not provide reach
        impressions: metrics?.impression_count ?? null, // Only available for some accounts
      };
    } catch (error) {
      return {
        likes: 0,
        comments: 0,
        shares: 0,
        reach: null,
        impressions: null,
      };
    }
  }
}
