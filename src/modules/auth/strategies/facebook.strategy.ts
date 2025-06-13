import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-facebook';
import { Injectable } from '@nestjs/common';
import appConfig from '../../../config/app.config';

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
  constructor() {
    super({
      clientID: appConfig().auth.facebook.app_id,
      clientSecret: appConfig().auth.facebook.app_secret,
      callbackURL: appConfig().auth.facebook.callback,
      scope: ['email', 'public_profile'],
      profileFields: ['id', 'emails', 'name', 'picture.type(large)'], // get email and profile picture
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: Function,
  ): Promise<any> {
    const { id, emails, name, photos } = profile;
    const user = {
      id,
      email: emails && emails[0] ? emails[0].value : null,
      firstName: name?.givenName || name?.firstName,
      lastName: name?.familyName || name?.lastName,
      picture: photos && photos[0] ? photos[0].value : null,
      accessToken,
      refreshToken,
      provider: 'facebook',
    };
    done(null, user);
  }
}
