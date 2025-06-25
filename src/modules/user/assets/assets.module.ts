import { Module } from '@nestjs/common';
import { AssetsService } from './assets.service';
import { AssetsController } from './assets.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { PostModule } from 'src/modules/reseller/post/post.module';
import { DesignFileModule } from 'src/modules/reseller/design-file/design-file.module';

@Module({
  imports: [PrismaModule, PostModule, DesignFileModule],
  controllers: [AssetsController],
  providers: [AssetsService],
})
export class AssetsModule { }
