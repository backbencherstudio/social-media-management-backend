import { Injectable } from '@nestjs/common';
import { TwitterService } from '../platforms/twitter.service';
import { FacebookService } from '../platforms/facebook.service';
import { InstagramService } from '../platforms/instagram.service';
import { LinkedInService } from '../platforms/linkedin.service';

@Injectable()
export class ProviderValidatorService {
  constructor(
    private readonly twitterService: TwitterService,
    private readonly facebookService: FacebookService,
    private readonly instagramService: InstagramService,
    private readonly linkedinService: LinkedInService,
  ) {}

  async validateAccount(
    provider: string,
    credentials: { accessToken: string; providerAccountId?: string; username?: string }
  ): Promise<void> {
    switch (provider) {
      case 'twitter':
        await this.twitterService.getProfile(
          credentials.accessToken,
          credentials.providerAccountId || credentials.username,
        );
        break;
      case 'facebook':
        await this.facebookService.getProfile(credentials.accessToken);
        break;
      case 'instagram':
        await this.instagramService.getProfile(credentials.accessToken);
        break;
      case 'linkedin':
        await this.linkedinService.getProfile(credentials.accessToken);
        break;
      default:
        throw new Error('Unsupported provider');
    }
  }
} 