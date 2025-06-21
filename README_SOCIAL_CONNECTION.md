# Social Media Account Connection Guide

This guide explains how users can connect their social media accounts (Facebook, Instagram, Twitter, LinkedIn) to your application and how the backend handles credential management and data fetching.

## Overview

Your application supports two methods for connecting social media accounts:

1. **OAuth Flow** (Recommended) - Users click "Connect" and authorize through the platform
2. **Manual Credential Input** - Users provide their access tokens directly

## API Endpoints

### 1. List Available Connections
```http
GET /socials/connections
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "name": "Facebook",
      "status": "Connected",
      "details": {
        "username": "john_doe"
      }
    },
    {
      "name": "Instagram", 
      "status": "Not Connected",
      "details": null
    }
  ]
}
```

### 2. Connect with Manual Credentials
```http
POST /socials/connect/manual
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "provider": "facebook",
  "accessToken": "EAABwzLixnjYBO...",
  "refreshToken": "optional_refresh_token",
  "providerAccountId": "123456789",
  "pageId": "987654321", // For Facebook pages
  "username": "john_doe" // For Instagram/Twitter
}
```

### 3. Get Pages (Facebook/Instagram/LinkedIn)
```http
GET /socials/pages/facebook
Authorization: Bearer <jwt_token>
```

### 4. Get Profile Information
```http
GET /socials/profile/facebook
Authorization: Bearer <jwt_token>
```

### 5. Get Analytics
```http
GET /socials/analytics/facebook
Authorization: Bearer <jwt_token>
```

### 6. Test Connection
```http
GET /socials/test-connection/facebook
Authorization: Bearer <jwt_token>
```

### 7. Update Credentials
```http
PUT /socials/credentials/facebook
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "accessToken": "new_access_token",
  "refreshToken": "new_refresh_token",
  "providerAccountId": "new_account_id"
}
```

### 8. Disconnect Account
```http
DELETE /socials/disconnect/facebook
Authorization: Bearer <jwt_token>
```

## How to Get Access Tokens

### Facebook
1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create an app and get App ID and App Secret
3. Use Facebook Login to get user access token
4. For pages, use `/me/accounts` endpoint to get page access tokens

### Instagram
1. Instagram uses Facebook Graph API
2. Connect through Facebook Business account
3. Get Instagram Business account ID from Facebook

### Twitter
1. Go to [Twitter Developer Portal](https://developer.twitter.com/)
2. Create an app and get API keys
3. Use OAuth 2.0 to get user access token

### LinkedIn
1. Go to [LinkedIn Developers](https://developer.linkedin.com/)
2. Create an app and get Client ID and Secret
3. Use OAuth 2.0 to get access token

## Frontend Integration Example

```javascript
// Connect Facebook account
async function connectFacebook() {
  const credentials = {
    provider: 'facebook',
    accessToken: 'user_provided_access_token',
    providerAccountId: 'user_facebook_id'
  };

  const response = await fetch('/socials/connect/manual', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${userToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(credentials)
  });

  const result = await response.json();
  if (result.success) {
    console.log('Facebook connected successfully');
  }
}

// Get user's Facebook pages
async function getFacebookPages() {
  const response = await fetch('/socials/pages/facebook', {
    headers: {
      'Authorization': `Bearer ${userToken}`
    }
  });

  const result = await response.json();
  if (result.success) {
    console.log('Facebook pages:', result.data);
  }
}

// Test connection
async function testFacebookConnection() {
  const response = await fetch('/socials/test-connection/facebook', {
    headers: {
      'Authorization': `Bearer ${userToken}`
    }
  });

  const result = await response.json();
  if (result.success && result.data.connected) {
    console.log('Facebook connection is working');
  }
}
```

## Security Considerations

1. **Token Storage**: Access tokens are encrypted and stored securely in the database
2. **Token Expiry**: Tokens have expiration dates and should be refreshed
3. **Scope Limitation**: Only request necessary permissions from users
4. **HTTPS**: Always use HTTPS for all API communications

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error description"
}
```

Common errors:
- `Provider not connected`
- `Invalid access token`
- `Token expired`
- `API rate limit exceeded`

## Data Flow

1. **User provides credentials** → Backend validates and stores
2. **Backend makes API calls** → Fetches data from social platforms
3. **Data is processed** → Normalized and returned to frontend
4. **Frontend displays** → Shows posts, analytics, profile info

## Next Steps

1. Implement token refresh logic
2. Add webhook support for real-time updates
3. Implement rate limiting for API calls
4. Add analytics dashboard
5. Support for multiple accounts per platform 