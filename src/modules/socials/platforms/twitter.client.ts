import { TwitterApi } from 'twitter-api-v2';
import { Account } from '@prisma/client';

/**
 * Creates a TwitterApi client instance from account credentials
 * @param account - The account object containing Twitter API credentials
 * @returns TwitterApi client instance
 * @throws Error if required credentials are missing
 */
export function createTwitterClient(account: Account): TwitterApi {
    if (!account.api_key || !account.api_secret || !account.access_token || !account.access_secret) {
        throw new Error('Missing Twitter API credentials (api_key, api_secret, access_token, access_secret) in account model');
    }

    return new TwitterApi({
        appKey: account.api_key,
        appSecret: account.api_secret,
        accessToken: account.access_token,
        accessSecret: account.access_secret,
    });
} 