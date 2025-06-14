import { Module } from '@nestjs/common';
import { SocialsController } from './socials.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { FacebookService } from './platforms/facebook.service';
import { InstagramService } from './platforms/instagram.service';
import { TwitterService } from './platforms/twitter.service';
import { LinkedInService } from './platforms/linkedin.service';
import { SocialsService } from './socials.service';

@Module({
  imports: [PrismaModule],
  controllers: [SocialsController],
  providers: [
    SocialsService,
    FacebookService,
    InstagramService,
    TwitterService,
    LinkedInService,
  ],
})
export class SocialsModule {}
