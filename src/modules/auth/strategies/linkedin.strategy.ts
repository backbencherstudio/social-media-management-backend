import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-linkedin-oauth2';
import appConfig from '../../../config/app.config';

@Injectable()
export class LinkedInStrategy extends PassportStrategy(Strategy, 'linkedin') {
  constructor() {
    super({
      clientID: appConfig().auth.linkedin.app_id,
      clientSecret: appConfig().auth.linkedin.app_secret,
      callbackURL: appConfig().auth.linkedin.callback,
      scope: ['r_emailaddress', 'r_liteprofile'],
      state: false,
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: any, done: Function) {
    const { id, emails, photos, name } = profile;

    const user = {
      id,
      email: emails?.[0]?.value,
      firstName: name?.givenName,
      lastName: name?.familyName,
      avatar: photos?.[0]?.value,
      accessToken,
      refreshToken,
      provider: 'linkedin',
    };

    done(null, user);
  }
}
