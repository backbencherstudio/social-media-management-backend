import { Module } from '@nestjs/common';
import { BlogCategoryService } from './blog_category.service';
import { BlogCategoryController } from './blog_category.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [BlogCategoryController],
  providers: [BlogCategoryService, PrismaService],
})
export class BlogCategoryModule {}
    