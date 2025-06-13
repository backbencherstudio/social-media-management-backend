import { Controller, Get, Req, UseGuards, Delete, Param, Res } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthGuard } from '@nestjs/passport';
import axios from 'axios';

@Controller('socials')
export class SocialsController {
  constructor(private readonly prisma: PrismaService) {}

  @UseGuards(JwtAuthGuard)
  @Get('connections')
  async getSocialConnections(@Req() req) {
    const userId = req.user.userId;
    const channels = await this.prisma.channel.findMany();
    const accounts = await this.prisma.account.findMany({ where: { user_id: userId } });
    return {
      success: true,
      data: channels.map(channel => {
        const account = accounts.find(
          acc => acc.provider?.toLowerCase() === channel.name?.toLowerCase()
        );
        return {
          name: channel.name,
          //icon: channel.icon,
          status: account ? 'Connected' : 'Not Connected',
          details: account
            ? { username: account.provider_account_id }
            : null,
        };
      })
    };
  }

  @UseGuards(JwtAuthGuard)
  @Delete('disconnect/:provider')
  async disconnect(@Req() req, @Param('provider') provider: string) {
    const userId = req.user.userId;
    await this.prisma.account.deleteMany({
      where: {
        user_id: userId,
        provider: provider,
      },
    });
    return { success: true, message: `${provider} disconnected` };
  }

  // Unified endpoint to fetch posts, likes, comments, shares
  @UseGuards(JwtAuthGuard)
  @Get('posts/:provider')
  async getSocialPosts(@Req() req, @Param('provider') provider: string) {
    const userId = req.user.userId;
    try {
      if (provider === 'facebook') {
        return { success: true, data: await fetchFacebookPosts(userId, this.prisma) };
      }
      if (provider === 'instagram') {
        return { success: true, data: await fetchInstagramPosts(userId, this.prisma) };
      }
      if (provider === 'twitter') {
        return { success: true, data: await fetchTwitterPosts(userId, this.prisma) };
      }
      if (provider === 'linkedin') {
        return { success: true, data: await fetchLinkedInPosts(userId, this.prisma) };
      }
      return { success: false, message: 'Provider not supported' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // // FACEBOOK
  // @Get('facebook')
  // @UseGuards(AuthGuard('facebook'))
  // async facebookLogin() {}

  // @Get('facebook/redirect')
  // @UseGuards(AuthGuard('facebook'))
  // async facebookLoginRedirect(@Req() req, @Res() res) {
  //   // Save tokens/profile to Account table
  //   const userId = req.session.userId || req.user.userId; // or from JWT
  //   const { id, accessToken, refreshToken, provider } = req.user;
  //   await this.prisma.account.upsert({
  //     where: {
  //       provider_provider_account_id: {
  //         provider,
  //         provider_account_id: id,
  //       }
  //     },
  //     update: {
  //       access_token: accessToken,
  //       refresh_token: refreshToken,
  //       user_id: userId,
  //     },
  //     create: {
  //       provider,
  //       provider_account_id: id,
  //       access_token: accessToken,
  //       refresh_token: refreshToken,
  //       user_id: userId,
  //     }
  //   });
  //   return res.redirect('/socials?connected=facebook');
  // }

//   // INSTAGRAM (via Facebook)
//   @Get('instagram')
//   @UseGuards(AuthGuard('facebook')) // Use Facebook strategy!
//   async instagramLogin() {}

//   @Get('instagram/redirect')
//   @UseGuards(AuthGuard('facebook'))
//   async instagramLoginRedirect(@Req() req, @Res() res) {
//     // Save tokens/profile to Account table, then use Graph API to fetch Instagram business accounts
//     return res.redirect('/socials?connected=instagram');
//   }
 }

async function fetchFacebookPosts(userId: string, prisma: PrismaService) {
  // 1. Get the user's Facebook account and access token
  const account = await prisma.account.findFirst({
    where: { user_id: userId, provider: 'facebook' }
  });
  if (!account) throw new Error('Facebook not connected');

  const pageId = account.provider_account_id; // Facebook Page ID
  const accessToken = account.access_token;

  // 2. Fetch posts from Facebook Graph API
  const postsRes = await axios.get(
    `https://graph.facebook.com/v19.0/${pageId}/posts`,
    {
      params: {
        fields: 'id,message,created_time,insights.metric(post_impressions,post_engaged_users,post_reactions_by_type_total),comments.summary(true),shares',
        access_token: accessToken,
      }
    }
  );

  // 3. Return the posts and their metrics
  return postsRes.data;
}

async function fetchInstagramPosts(userId: string, prisma: PrismaService) {
  const account = await prisma.account.findFirst({
    where: { user_id: userId, provider: 'instagram' }
  });
  if (!account) throw new Error('Instagram not connected');

  const igUserId = account.provider_account_id; // Instagram Business Account ID
  const accessToken = account.access_token;

  const postsRes = await axios.get(
    `https://graph.facebook.com/v19.0/${igUserId}/media`,
    {
      params: {
        fields: 'id,caption,media_type,media_url,permalink,thumbnail_url,timestamp,username,comments_count,like_count',
        access_token: accessToken,
      }
    }
  );
  return postsRes.data;
}

async function fetchTwitterPosts(userId: string, prisma: PrismaService) {
  const account = await prisma.account.findFirst({
    where: { user_id: userId, provider: 'twitter' }
  });
  if (!account) throw new Error('Twitter not connected');

  const twitterUserId = account.provider_account_id;
  const accessToken = account.access_token;

  const tweetsRes = await axios.get(
    `https://api.twitter.com/2/users/${twitterUserId}/tweets`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: {
        'tweet.fields': 'created_at,public_metrics',
        max_results: 10,
      }
    }
  );
  return tweetsRes.data;
}

async function fetchLinkedInPosts(userId: string, prisma: PrismaService) {
  const account = await prisma.account.findFirst({
    where: { user_id: userId, provider: 'linkedin' }
  });
  if (!account) throw new Error('LinkedIn not connected');

  const accessToken = account.access_token;
  const personUrn = `urn:li:person:${account.provider_account_id}`;

  const postsRes = await axios.get(
    'https://api.linkedin.com/v2/shares',
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: {
        q: 'owners',
        owners: personUrn,
        sharesPerOwner: 10,
      }
    }
  );
  return postsRes.data;
} 