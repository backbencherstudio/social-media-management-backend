import { TwitterApi } from 'twitter-api-v2';
import { Account } from '@prisma/client';
import appConfig from 'src/config/app.config';

/**
 * Creates a TwitterApi client instance from account credentials
 * @param account - The account object containing Twitter API credentials
 * @returns TwitterApi client instance
 * @throws Error if required credentials are missing
 */
export function createTwitterClient(account: Account): TwitterApi {
    // Check for required credentials
    if (!account.access_token || !account.access_secret) {
        throw new Error('Missing Twitter API credentials (access_token, access_secret) in account model');
    }

    // Use app credentials from config and user credentials from account
    return new TwitterApi({
        appKey: appConfig().auth.twitter.app_id,        // App API Key
        appSecret: appConfig().auth.twitter.app_secret,  // App API Secret
        accessToken: account.access_token,               // User Access Token
        accessSecret: account.access_secret,             // User Access Secret
    });
} 