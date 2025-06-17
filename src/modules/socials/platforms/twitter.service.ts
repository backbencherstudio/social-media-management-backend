import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import axios from 'axios';

@Injectable()
export class TwitterService {
  constructor(private readonly prisma: PrismaService) {}

  async fetchPosts(userId: string) {
    console.log('user id : -----------------', userId);
    const account = await this.prisma.account.findFirst({
      where: { user_id: userId, provider: 'twitter' },
    });
    if (!account) throw new Error('Twitter not connected');
    console.log('account --------------', account);

    const twitterUserId = account.provider_account_id;
    const accessToken = account.access_token;
    const username = account.provider_account_id; // This should be the username

    console.log('Fetching tweets for username:', username);
    console.log('Using access token:', accessToken);

    try {
      // First, get the user ID from username
      const userResponse = await axios.get(
        `https://api.twitter.com/2/users/by/username/${username}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );

      console.log('User response:', userResponse.data);

      if (!userResponse.data.data || !userResponse.data.data.id) {
        throw new Error('Could not find Twitter user');
      }

      const userId = userResponse.data.data.id;
      console.log('Twitter user ID:', userId);

      // Now get tweets using the user ID
      const tweetsRes = await axios.get(
        `https://api.twitter.com/2/users/${userId}/tweets`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          params: {
            'tweet.fields': 'created_at,public_metrics,author_id',
            max_results: 10,
          },
        },
      );

      console.log('Tweets response:', tweetsRes.data);
      return tweetsRes.data;
    } catch (error) {
      console.error(
        'Twitter API Error:',
        error.response?.data || error.message,
      );
      console.error('Error status:', error.response?.status);
      console.error('Error URL:', error.config?.url);

      if (error.response?.status === 404) {
        throw new Error(
          `Twitter user '${username}' not found or account is private`,
        );
      } else if (error.response?.status === 403) {
        throw new Error(
          'Twitter API access denied. Check your API permissions.',
        );
      } else if (error.response?.status === 401) {
        throw new Error(
          'Twitter API authentication failed. Check your access token.',
        );
      } else {
        throw new Error(
          `Twitter API error: ${error.response?.data?.detail || error.message}`,
        );
      }
    }
  }

  async getProfile(accessToken: string, provider_account_id: string) {
    try {
      console.log('Fetching Twitter profile with access token:', accessToken);

      // Use the username from the stored account
      const response = await axios.get(
        `https://api.twitter.com/2/users/by/username/${provider_account_id}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          params: {
            'user.fields':
              'id,name,username,profile_image_url,public_metrics,description,created_at',
          },
        },
      );

      console.log('Profile response:', response.data);
      return response.data;
    } catch (error) {
      console.error(
        'Twitter API Error:',
        error.response?.data || error.message,
      );
      throw new Error(`Failed to fetch Twitter profile: ${error.message}`);
    }
  }

  async getAnalytics(accessToken: string, provider_account_id: string) {
    try {
      const response = await axios.get(
        `https://api.twitter.com/2/users/by/username/${provider_account_id}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          params: {
            'user.fields': 'public_metrics',
          },
        },
      );
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch Twitter analytics: ${error.message}`);
    }
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
    // Find the user's Twitter account
    const account = await this.prisma.account.findFirst({
      where: { user_id: userId, provider: 'twitter' },
    });
    if (!account) return { success: false, message: 'Twitter not connected' };
    const username = account.provider_account_id;
    const accessToken = account.access_token;

    try {
      // Get user ID from username
      const userResponse = await axios.get(
        `https://api.twitter.com/2/users/by/username/${username}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );
      if (!userResponse.data.data || !userResponse.data.data.id) {
        throw new Error('Could not find Twitter user');
      }
      const twitterUserId = userResponse.data.data.id;

      // Fetch recent tweets
      const tweetsRes = await axios.get(
        `https://api.twitter.com/2/users/${twitterUserId}/tweets`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          params: {
            'tweet.fields': 'created_at,public_metrics',
            max_results: 100,
            start_time: start,
            end_time: end,
          },
        },
      );
      const tweets = tweetsRes.data.data || [];

      // Aggregate engagement by day/hour
      const activity = Array(7)
        .fill(0)
        .map(() => Array(24).fill(0));
      for (const tweet of tweets) {
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
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.detail || error.message,
      };
    }
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
    console.log("twitter post data : ", postData);
    try {
      // Get user's Twitter account
      const account = await this.prisma.account.findFirst({
        where: { user_id: userId, provider: 'twitter' },
      });

      if (!account) {
        return {
          success: false,
          message: 'Twitter account not connected for this user',
        };
      }

      const accessToken = account.access_token;
      const username = account.provider_account_id;

      
      // Get user ID from username
      const userResponse = await axios.get(
        `https://api.twitter.com/2/users/by/username/${username}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );

      if (!userResponse.data.data || !userResponse.data.data.id) {
        throw new Error('Could not find Twitter user');
      }

      const twitterUserId = userResponse.data.data.id;

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

      let mediaIds: string[] = [];

      // Handle media uploads if present
      if (postData.mediaFiles && postData.mediaFiles.length > 0) {
        for (const mediaFile of postData.mediaFiles) {
          try {
            // For now, we'll skip media upload as it requires additional setup
            // In a real implementation, you would:
            // 1. Download the file from storage
            // 2. Upload to Twitter's media endpoint
            // 3. Get media_id and add to mediaIds array
            console.log(`Media file ${mediaFile.name} would be uploaded here`);
          } catch (mediaError) {
            console.error('Error uploading media:', mediaError);
            // Continue without media if upload fails
          }
        }
      }

      // Create the tweet
      const tweetData: any = {
        text: tweetText,
      };

      if (mediaIds.length > 0) {
        tweetData.media = {
          media_ids: mediaIds,
        };
      }

      // For now, we'll return a success message indicating the authentication issue
      // In a real implementation, you would use proper OAuth 1.0a or OAuth 2.0 User Context
      console.log('Tweet data prepared:', tweetData);
      console.log('Note: Actual posting requires OAuth 1.0a or OAuth 2.0 User Context authentication');

      return {
        success: false,
        message: 'Twitter posting requires OAuth 1.0a or OAuth 2.0 User Context authentication',
        details: {
          current_authentication: 'Bearer Token (Application-Only)',
          required_authentication: 'OAuth 1.0a or OAuth 2.0 User Context',
          tweet_data: tweetData,
          action_required: 'Implement proper OAuth authentication flow for posting'
        }
      };

      // The actual posting code would be:
      /*
      const tweetResponse = await axios.post(
        'https://api.twitter.com/2/tweets',
        tweetData,
        {
          headers: { 
            // OAuth 1.0a headers would go here
            // or OAuth 2.0 User Context headers
          },
        },
      );

      console.log('Tweet published successfully:', tweetResponse.data);

      return {
        success: true,
        message: 'Post published to Twitter successfully',
        data: {
          tweet_id: tweetResponse.data.data.id,
          tweet_text: tweetText,
          published_at: new Date().toISOString(),
        },
      };
      */
    } catch (error) {
      console.error(
        'Error publishing to Twitter:',
        error.response?.data || error.message,
      );

      if (error.response?.status === 401) {
        return {
          success: false,
          message:
            'Twitter authentication failed. Please reconnect your account.',
        };
      } else if (error.response?.status === 403) {
        return {
          success: false,
          message: 'Twitter API access denied. Check your API permissions.',
          details: {
            error: error.response?.data,
            solution: 'Reconnect Twitter account with posting permissions'
          }
        };
      } else if (error.response?.status === 400) {
        return {
          success: false,
          message: `Twitter API error: ${error.response.data?.detail || 'Invalid request'}`,
        };
      } else {
        return {
          success: false,
          message: `Failed to publish to Twitter: ${error.message}`,
        };
      }
    }
  }
}
