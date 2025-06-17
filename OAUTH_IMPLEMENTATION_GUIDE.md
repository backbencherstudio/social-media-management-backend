# OAuth Implementation Guide for Twitter Posting

This guide provides step-by-step instructions for implementing OAuth 1.0a or OAuth 2.0 User Context authentication to enable Twitter posting functionality.

## Current Issue

The system currently uses Bearer tokens (OAuth 2.0 Application-Only) which only support read operations. To enable posting tweets, we need to implement either:

- **OAuth 1.0a User Context** (Recommended for simplicity)
- **OAuth 2.0 User Context** (More modern, supports token refresh)

## Quick Fix: OAuth 1.0a Implementation

### Step 1: Install Required Dependencies

```bash
npm install oauth-1.0a crypto
```

### Step 2: Update Database Schema

Create a new migration to add OAuth fields:

```sql
-- Add OAuth 1.0a fields to accounts table
ALTER TABLE accounts ADD COLUMN oauth1_access_token VARCHAR(255);
ALTER TABLE accounts ADD COLUMN oauth1_access_token_secret VARCHAR(255);
ALTER TABLE accounts ADD COLUMN oauth1_consumer_key VARCHAR(255);
ALTER TABLE accounts ADD COLUMN oauth1_consumer_secret VARCHAR(255);
ALTER TABLE accounts ADD COLUMN token_type VARCHAR(50) DEFAULT 'bearer';
```

### Step 3: Update Twitter Service

Replace the `publishPost` method in `src/modules/socials/platforms/twitter.service.ts`:

```typescript
import OAuth from 'oauth-1.0a';
import crypto from 'crypto';

// ... existing code ...

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

    // Check if we have OAuth 1.0a credentials
    if (!account.oauth1_access_token || !account.oauth1_access_token_secret) {
      return {
        success: false,
        message: 'Twitter account needs OAuth 1.0a credentials for posting. Please reconnect with posting permissions.',
        details: {
          current_token_type: account.token_type || 'unknown',
          required_token_type: 'oauth1',
          action_required: 'Reconnect Twitter account with OAuth 1.0a credentials'
        }
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

    // Create OAuth 1.0a signature
    const oauth = new OAuth({
      consumer: {
        key: account.oauth1_consumer_key || process.env.TWITTER_CONSUMER_KEY,
        secret: account.oauth1_consumer_secret || process.env.TWITTER_CONSUMER_SECRET
      },
      signature_method: 'HMAC-SHA1',
      hash_function(base_string, key) {
        return crypto
          .createHmac('sha1', key)
          .update(base_string)
          .digest('base64');
      },
    });

    const request_data = {
      url: 'https://api.twitter.com/2/tweets',
      method: 'POST',
      data: { text: tweetText }
    };

    const headers = oauth.toHeader(oauth.authorize(request_data, {
      key: account.oauth1_access_token,
      secret: account.oauth1_access_token_secret
    }));

    // Post the tweet
    const response = await axios.post(request_data.url, request_data.data, {
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      }
    });

    console.log('Tweet published successfully:', response.data);

    return {
      success: true,
      message: 'Post published to Twitter successfully',
      data: {
        tweet_id: response.data.data.id,
        tweet_text: tweetText,
        published_at: new Date().toISOString(),
      },
    };
  } catch (error) {
    console.error(
      'Error publishing to Twitter:',
      error.response?.data || error.message,
    );

    if (error.response?.status === 401) {
      return {
        success: false,
        message: 'Twitter authentication failed. Please reconnect your account.',
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
```

### Step 4: Update Environment Variables

Add to your `.env` file:

```env
# Twitter OAuth 1.0a Credentials
TWITTER_CONSUMER_KEY=your_consumer_key_here
TWITTER_CONSUMER_SECRET=your_consumer_secret_here
```

### Step 5: Update Connection Flow

Modify the `connectWithCredentials` method in `src/modules/socials/socials.service.ts`:

```typescript
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

    // Add OAuth 1.0a fields if provided
    if (credentials.oauth1AccessToken) {
      accountData.oauth1_access_token = credentials.oauth1AccessToken;
      accountData.oauth1_access_token_secret = credentials.oauth1AccessTokenSecret;
      accountData.oauth1_consumer_key = credentials.oauth1ConsumerKey;
      accountData.oauth1_consumer_secret = credentials.oauth1ConsumerSecret;
      accountData.token_type = 'oauth1';
    }

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
```

### Step 6: Update DTO

Add OAuth fields to `src/modules/socials/dto/createCredentialDto.ts`:

```typescript
export class CreateCredentialDto {
  @IsString()
  provider: string;

  @IsString()
  accessToken: string;

  @IsString()
  @IsOptional()
  refreshToken?: string;

  @IsString()
  @IsOptional()
  providerAccountId?: string;

  @IsString()
  @IsOptional()
  username?: string;

  // OAuth 1.0a fields
  @IsString()
  @IsOptional()
  oauth1AccessToken?: string;

  @IsString()
  @IsOptional()
  oauth1AccessTokenSecret?: string;

  @IsString()
  @IsOptional()
  oauth1ConsumerKey?: string;

  @IsString()
  @IsOptional()
  oauth1ConsumerSecret?: string;
}
```

## Testing the Implementation

### 1. Test OAuth Connection

```bash
curl -X POST "http://localhost:3000/socials/connect/manual" \
  -H "Authorization: Bearer <jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "twitter",
    "accessToken": "your_bearer_token",
    "oauth1AccessToken": "your_oauth1_access_token",
    "oauth1AccessTokenSecret": "your_oauth1_access_token_secret",
    "oauth1ConsumerKey": "your_consumer_key",
    "oauth1ConsumerSecret": "your_consumer_secret",
    "providerAccountId": "your_twitter_username"
  }'
```

### 2. Test Posting

```bash
curl -X POST "http://localhost:3000/socials/publish/twitter" \
  -H "Authorization: Bearer <jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Test tweet with OAuth 1.0a! 🚀",
    "hashtags": ["test", "oauth", "twitter"]
  }'
```

## Getting Twitter OAuth 1.0a Credentials

### 1. Twitter Developer Setup

1. Go to https://developer.twitter.com/
2. Create a new app or use existing app
3. Set app permissions to "Read and Write"
4. Enable OAuth 1.0a

### 2. Get User Credentials

You'll need to implement a proper OAuth flow to get user credentials. For testing, you can use:

1. **Twitter OAuth Helper**: Use a tool like Postman or Insomnia
2. **Manual OAuth Flow**: Implement the 3-legged OAuth flow
3. **Third-party Library**: Use a library like `passport-twitter`

### 3. Required Credentials

- **Consumer Key**: From your Twitter app
- **Consumer Secret**: From your Twitter app  
- **Access Token**: Generated through OAuth flow
- **Access Token Secret**: Generated through OAuth flow

## Alternative: OAuth 2.0 User Context

If you prefer OAuth 2.0, the implementation is similar but requires:

1. **Client ID** and **Client Secret** from Twitter app
2. **Access Token** and **Refresh Token** from OAuth 2.0 flow
3. Token refresh logic when tokens expire

## Troubleshooting

### Common Issues

1. **"Invalid or expired token"**
   - Check that OAuth credentials are correct
   - Verify app permissions include "Read and Write"

2. **"OAuth signature invalid"**
   - Ensure all OAuth 1.0a parameters are provided
   - Check that signature generation is correct

3. **"Rate limit exceeded"**
   - Twitter has rate limits (300 tweets per 3 hours)
   - Implement rate limiting in your application

### Debug Mode

Enable detailed logging:

```typescript
// In TwitterService
console.log('OAuth headers:', headers);
console.log('Request data:', request_data);
console.log('Response:', response.data);
```

## Next Steps

1. **Implement the OAuth flow** for user authentication
2. **Add token refresh logic** for OAuth 2.0
3. **Implement media upload** for images/videos
4. **Add rate limiting** to respect Twitter's limits
5. **Test thoroughly** with real Twitter accounts

## Security Notes

- Store OAuth credentials securely (encrypted in database)
- Never expose credentials in logs or error messages
- Implement proper token refresh for OAuth 2.0
- Use HTTPS for all OAuth communications
- Regularly rotate credentials

---

This implementation will enable full Twitter posting functionality while maintaining the existing read-only capabilities. 