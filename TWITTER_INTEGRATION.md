# Twitter Integration for Social Media Management

This document describes the automatic Twitter posting functionality for resellers in the social media management system.

## Overview

When a reseller creates a post for a user, the post will be automatically published directly to the user's connected Twitter account. The system is designed so that posts are published directly from the server to the user's social media account without any manual action needed from the user.

## ⚠️ **IMPORTANT: Authentication Requirements**

**Current Issue**: The system currently uses Bearer tokens (OAuth 2.0 Application-Only) which only support read operations. Twitter's posting endpoint requires **OAuth 1.0a User Context** or **OAuth 2.0 User Context** authentication.

### Authentication Types

1. **Bearer Token (OAuth 2.0 Application-Only)** - ✅ **Currently Implemented**
   - Supports: Reading tweets, profiles, analytics
   - Does NOT support: Posting tweets, media uploads
   - Use case: Read-only operations

2. **OAuth 1.0a User Context** - ❌ **Required for Posting**
   - Supports: All operations including posting tweets
   - Requires: Consumer key, consumer secret, access token, access token secret
   - Use case: Full Twitter API access

3. **OAuth 2.0 User Context** - ❌ **Required for Posting**
   - Supports: All operations including posting tweets
   - Requires: Client ID, client secret, access token, refresh token
   - Use case: Full Twitter API access

## Architecture

### Flow Diagram

```
Reseller → Creates Post → Post Service → Queue → Post Processor → Twitter API → User's Twitter Account
```

### Key Components

1. **Post Service** (`src/modules/reseller/post/post.service.ts`)
   - Handles post creation and queuing
   - Links posts to tasks and users

2. **Post Processor** (`src/modules/reseller/post/processors/post.processor.ts`)
   - Processes queued posts
   - Publishes to social media platforms
   - Updates post status

3. **Twitter Service** (`src/modules/socials/platforms/twitter.service.ts`)
   - Handles Twitter API interactions
   - Publishes tweets with content and media

4. **Socials Service** (`src/modules/socials/socials.service.ts`)
   - Manages social media connections
   - Coordinates posting across platforms

## Database Schema

### Post Model
```prisma
model Post {
  id         String    @id @default(cuid())
  content    String?   @db.Text
  hashtags   String[]
  task_id    String?   // Links to TaskAssign
  status     Int?      @default(0) // 0=pending, 1=approved, 2=processing, 3=published, 4=failed
  schedule_at DateTime?
  // ... other fields
}
```

### TaskAssign Model
```prisma
model TaskAssign {
  id         String   @id @default(cuid())
  user_id    String?  // The user who owns the social media accounts
  reseller_id String? // The reseller assigned to the task
  posts      Post[]   // Posts created for this task
  // ... other fields
}
```

### Account Model (Enhanced for OAuth)
```prisma
model Account {
  id         String    @id @default(cuid())
  user_id    String
  provider   String?   // "twitter"
  provider_account_id String?
  
  // OAuth 2.0 Application-Only (Bearer Token)
  access_token String? // Bearer token for read operations
  
  // OAuth 1.0a User Context (for posting)
  oauth1_access_token String?
  oauth1_access_token_secret String?
  oauth1_consumer_key String?
  oauth1_consumer_secret String?
  
  // OAuth 2.0 User Context (for posting)
  oauth2_access_token String?
  oauth2_refresh_token String?
  oauth2_client_id String?
  oauth2_client_secret String?
  
  token_type String? // "bearer", "oauth1", "oauth2_user"
  expires_at DateTime?
  
  // ... other fields
}
```

## API Endpoints

### Create Post for User (Reseller Endpoint)
```http
POST /post/for-user/:userId/:taskId
Content-Type: multipart/form-data

{
  "content": "Your post content here",
  "hashtags": ["tag1", "tag2"],
  "post_channels": [
    { "channel_id": "twitter-channel-id" }
  ],
  "schedule_at": "2024-01-01T10:00:00Z" // Optional
}
```

### Publish Post Directly (Testing)
```http
POST /socials/publish/twitter
Authorization: Bearer <jwt-token>

{
  "content": "Test tweet content",
  "hashtags": ["test", "integration"],
  "mediaFiles": [
    {
      "name": "image.jpg",
      "type": "image",
      "file_path": "path/to/image"
    }
  ]
}
```

## Current Status

### ✅ **What Works Now**
- Reading tweets and profiles
- Fetching analytics
- Testing connections
- Post creation and queuing
- Post approval workflow

### ❌ **What Needs Implementation**
- OAuth 1.0a or OAuth 2.0 User Context authentication
- Actual tweet posting
- Media upload to Twitter

### 🔄 **Current Behavior**
When attempting to post, the system returns:
```json
{
  "success": false,
  "message": "Twitter posting requires OAuth 1.0a or OAuth 2.0 User Context authentication",
  "details": {
    "current_authentication": "Bearer Token (Application-Only)",
    "required_authentication": "OAuth 1.0a or OAuth 2.0 User Context",
    "tweet_data": { "text": "Your tweet content" },
    "action_required": "Implement proper OAuth authentication flow for posting"
  }
}
```

## Implementation Solutions

### Option 1: OAuth 1.0a Implementation

```typescript
// Add to TwitterService
import OAuth from 'oauth-1.0a';
import crypto from 'crypto';

async publishPostWithOAuth1(userId: string, postData: any) {
  const account = await this.prisma.account.findFirst({
    where: { user_id: userId, provider: 'twitter' },
  });

  const oauth = new OAuth({
    consumer: {
      key: account.oauth1_consumer_key,
      secret: account.oauth1_consumer_secret
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
    data: { text: postData.content }
  };

  const headers = oauth.toHeader(oauth.authorize(request_data, {
    key: account.oauth1_access_token,
    secret: account.oauth1_access_token_secret
  }));

  const response = await axios.post(request_data.url, request_data.data, {
    headers: {
      ...headers,
      'Content-Type': 'application/json'
    }
  });

  return response.data;
}
```

### Option 2: OAuth 2.0 User Context Implementation

```typescript
// Add to TwitterService
async publishPostWithOAuth2(userId: string, postData: any) {
  const account = await this.prisma.account.findFirst({
    where: { user_id: userId, provider: 'twitter' },
  });

  // Check if token needs refresh
  if (account.expires_at && new Date() > account.expires_at) {
    await this.refreshOAuth2Token(account);
  }

  const response = await axios.post(
    'https://api.twitter.com/2/tweets',
    { text: postData.content },
    {
      headers: {
        'Authorization': `Bearer ${account.oauth2_access_token}`,
        'Content-Type': 'application/json'
      }
    }
  );

  return response.data;
}
```

## Setup Instructions

### 1. Twitter Developer Account Setup

1. **Create Twitter Developer Account**
   - Go to https://developer.twitter.com/
   - Apply for a developer account
   - Create a new app

2. **Configure App Permissions**
   - Set app permissions to "Read and Write"
   - Enable OAuth 1.0a and OAuth 2.0

3. **Get Credentials**
   - **OAuth 1.0a**: Consumer Key, Consumer Secret
   - **OAuth 2.0**: Client ID, Client Secret

### 2. Database Migration

```sql
-- Add OAuth fields to Account table
ALTER TABLE accounts ADD COLUMN oauth1_access_token VARCHAR(255);
ALTER TABLE accounts ADD COLUMN oauth1_access_token_secret VARCHAR(255);
ALTER TABLE accounts ADD COLUMN oauth1_consumer_key VARCHAR(255);
ALTER TABLE accounts ADD COLUMN oauth1_consumer_secret VARCHAR(255);
ALTER TABLE accounts ADD COLUMN oauth2_access_token VARCHAR(255);
ALTER TABLE accounts ADD COLUMN oauth2_refresh_token VARCHAR(255);
ALTER TABLE accounts ADD COLUMN oauth2_client_id VARCHAR(255);
ALTER TABLE accounts ADD COLUMN oauth2_client_secret VARCHAR(255);
```

### 3. Environment Variables

```env
# Twitter OAuth 1.0a (for posting)
TWITTER_CONSUMER_KEY=your_consumer_key
TWITTER_CONSUMER_SECRET=your_consumer_secret

# Twitter OAuth 2.0 (for posting)
TWITTER_CLIENT_ID=your_client_id
TWITTER_CLIENT_SECRET=your_client_secret

# Twitter Bearer Token (for reading)
TWITTER_BEARER_TOKEN=your_bearer_token
```

## Usage Examples

### 1. Reseller Creates Post for User

```typescript
// Reseller creates a post for a specific user and task
const postData = {
  content: "Exciting news about our new product launch! 🚀",
  hashtags: ["productlaunch", "innovation", "tech"],
  post_channels: [
    { channel_id: "twitter-channel-id" }
  ],
  schedule_at: new Date(Date.now() + 24 * 60 * 60 * 1000) // Schedule for tomorrow
};

const response = await fetch('/post/for-user/user123/task456', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(postData)
});
```

### 2. Post Approval Process

```typescript
// Admin or user approves the post
const response = await fetch('/post/postId123/review', {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    action: 1, // 1 = approve, 2 = reject
    feedback: "Great post! Approved for publishing."
  })
});
```

### 3. Automatic Publishing (After OAuth Implementation)

Once OAuth authentication is implemented and approved, the post is automatically queued and published to Twitter:

1. Post status changes to `1` (approved)
2. Post processor picks up the job
3. Twitter service publishes the tweet using OAuth 1.0a or OAuth 2.0
4. Post status changes to `3` (published)

## Error Handling

### Common Error Scenarios

1. **Authentication Type Mismatch**
   ```json
   {
     "success": false,
     "message": "Twitter posting requires OAuth 1.0a or OAuth 2.0 User Context authentication",
     "details": {
       "current_authentication": "Bearer Token (Application-Only)",
       "required_authentication": "OAuth 1.0a or OAuth 2.0 User Context",
       "action_required": "Implement proper OAuth authentication flow for posting"
     }
   }
   ```

2. **Twitter Account Not Connected**
   ```json
   {
     "success": false,
     "message": "Twitter account not connected for this user"
   }
   ```

3. **Content Too Long**
   ```json
   {
     "success": false,
     "message": "Tweet content exceeds 280 character limit"
   }
   ```

### Post Status Codes

- `0`: Pending approval
- `1`: Approved (ready for publishing)
- `2`: Processing (being published)
- `3`: Published successfully
- `4`: Failed to publish

## Security Considerations

1. **Token Storage**: OAuth tokens are stored securely in the database
2. **User Authorization**: Only authorized resellers can create posts for specific users
3. **Content Validation**: Posts are validated for length and content before publishing
4. **Rate Limiting**: Twitter API rate limits are respected
5. **Token Refresh**: OAuth 2.0 tokens are automatically refreshed when expired

## Monitoring and Logging

The system includes comprehensive logging:

```typescript
// Post processor logs
logger.log(`Processing job ${job.id} with name ${job.name}`);
logger.log(`Publishing post for user: ${userId}`);
logger.log(`Twitter publish result:`, twitterResult);
logger.error(`Error publishing to Twitter:`, error);
```

## Next Steps

### Immediate Actions Required

1. **Implement OAuth Authentication**
   - Choose between OAuth 1.0a or OAuth 2.0 User Context
   - Update the Twitter service with proper authentication
   - Add OAuth fields to the Account model

2. **Update Connection Flow**
   - Modify the social connection process to capture OAuth tokens
   - Implement token refresh for OAuth 2.0

3. **Test the Integration**
   - Test OAuth authentication flow
   - Verify tweet posting functionality
   - Test media upload (if needed)

### Future Enhancements

1. **Media Upload**: Implement proper media file upload to Twitter
2. **Multi-Platform Support**: Extend to Facebook, Instagram, LinkedIn
3. **Scheduling**: Enhanced scheduling with timezone support
4. **Analytics**: Track post performance and engagement
5. **Content Templates**: Pre-defined content templates for resellers

## Testing

### Manual Testing

1. Connect a Twitter account via the socials service (with OAuth)
2. Create a post for a user with Twitter channel
3. Approve the post
4. Verify the tweet appears on the connected Twitter account

### API Testing

```bash
# Test Twitter connection
curl -X GET "http://localhost:3000/socials/test-connection/twitter" \
  -H "Authorization: Bearer <jwt-token>"

# Test direct publishing (after OAuth implementation)
curl -X POST "http://localhost:3000/socials/publish/twitter" \
  -H "Authorization: Bearer <jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Test tweet from API",
    "hashtags": ["test", "api"]
  }'
```

## Troubleshooting

### Common Issues

1. **Authentication Errors**
   - Ensure OAuth 1.0a or OAuth 2.0 tokens are properly stored
   - Verify app permissions include "Read and Write"
   - Check token expiration and refresh

2. **Post Not Publishing**
   - Check if Twitter account is connected with OAuth
   - Verify post is approved (status = 1)
   - Check queue processing logs

3. **Content Issues**
   - Ensure content is under 280 characters
   - Check for invalid characters
   - Verify hashtag format

### Debug Mode

Enable debug logging by setting the log level:

```typescript
// In your application configuration
logger.setLogLevel('debug');
```

## Support

For issues or questions about the Twitter integration:

1. Check the application logs
2. Verify Twitter API status
3. Test with the provided API endpoints
4. Review this documentation
5. Ensure OAuth authentication is properly configured

---

**Note**: This integration requires OAuth 1.0a or OAuth 2.0 User Context authentication for posting functionality. The current Bearer token implementation only supports read operations. 