import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-twitter';
import appConfig from '../../../config/app.config';

@Injectable()
export class TwitterStrategy extends PassportStrategy(Strategy, 'twitter') {
  constructor() {
    super({
      consumerKey: appConfig().auth.twitter.app_id, // Twitter API key
      consumerSecret: appConfig().auth.twitter.app_secret, // Twitter API secret
      callbackURL: appConfig().auth.twitter.callback,
      includeEmail: true,
    });
  }

  async validate(token: string, tokenSecret: string, profile: any, done: Function) {
    const { username, displayName, photos, emails } = profile;

    const user = {
      id: profile.id,
      username,
      name: displayName,
      email: emails?.[0]?.value,
      avatar: photos?.[0]?.value,
      accessToken: token,
      refreshToken: tokenSecret,
      tokenSecret: tokenSecret,
      provider: 'twitter',
    };

    done(null, user);
  }
}
