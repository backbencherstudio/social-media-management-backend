import { Module } from '@nestjs/common';
import { PostService } from './post.service';
import { PostController } from './post.controller';
import { BullModule } from '@nestjs/bullmq';
import { PostProcessor } from './processors/post.processor';
import { PrismaModule } from '../../../prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    BullModule.registerQueue({
      name: 'post-schedule',
    }),
  ],
  controllers: [PostController],
  providers: [PostService, PostProcessor],
})
export class PostModule {}
