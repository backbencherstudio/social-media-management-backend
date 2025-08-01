import { Module } from '@nestjs/common';
import { PostService } from './post.service';
import { PostController } from './post.controller';
import { BullModule } from '@nestjs/bullmq';
import { PostProcessor } from './processors/post.processor';
import { PrismaModule } from '../../../prisma/prisma.module';
import { SocialsModule } from '../../socials/socials.module';
import { MessageGateway } from 'src/modules/chat/message/message.gateway';

@Module({
  imports: [
    PrismaModule,
    SocialsModule,
    BullModule.registerQueue({
      name: 'post-schedule',
    }),
  ],
  controllers: [PostController],
  providers: [PostService, PostProcessor, MessageGateway],
  exports: [PostService, PostService],
})
export class PostModule { }
