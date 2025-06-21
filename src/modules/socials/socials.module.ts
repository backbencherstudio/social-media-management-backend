import { Module } from '@nestjs/common';
import { SocialsController } from './socials.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { FacebookService } from './platforms/facebook.service';
import { InstagramService } from './platforms/instagram.service';
import { TwitterService } from './platforms/twitter.service';
import { LinkedInService } from './platforms/linkedin.service';
import { SocialsService } from './socials.service';
import { ProviderValidatorService } from './providers/provider-validator.service';

@Module({
  imports: [PrismaModule],
  controllers: [SocialsController],
  providers: [
    SocialsService,
    FacebookService,
    InstagramService,
    TwitterService,
    LinkedInService,
    ProviderValidatorService,
  ],
  exports: [
    SocialsService,
    FacebookService,
    InstagramService,
    TwitterService,
    LinkedInService,
    ProviderValidatorService,
  ],
})
export class SocialsModule { }
