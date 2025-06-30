import { Module } from '@nestjs/common';
import { PostService } from './post.service';
import { PostController } from './post.controller';
import { PrismaModule } from '../../../prisma/prisma.module';
import { PostModule as ResellerPostModule } from '../../reseller/post/post.module';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { MessageGateway } from 'src/modules/chat/message/message.gateway';

@Module({
  imports: [PrismaModule, ResellerPostModule],
  controllers: [PostController],
  providers: [PostService, MessageGateway],
})
export class PostModule { }
