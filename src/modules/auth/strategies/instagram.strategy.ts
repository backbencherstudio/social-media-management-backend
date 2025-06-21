// instagram.strategy.ts
import { PassportStrategy } from '@nestjs/passport';
import { Strategy as InstagramStrategyBase, StrategyOption } from 'passport-instagram';
import { Injectable } from '@nestjs/common';
import appConfig from '../../../config/app.config';

@Injectable()
export class InstagramStrategy extends PassportStrategy(InstagramStrategyBase, 'instagram') {
  constructor() {
    super({
      clientID: appConfig().auth.instagram.app_id,
      clientSecret: appConfig().auth.instagram.app_secret,
      callbackURL: appConfig().auth.instagram.callback,
    } as StrategyOption);
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: Function,
  ): Promise<any> {
    const user = {
      id: profile.id,
      username: profile.username,
      accessToken,
      refreshToken,
      provider: 'instagram',
    };
    done(null, user);
  }
}
