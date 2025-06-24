import { Controller, Get, Post, Body, Patch, Param, Delete, Req } from '@nestjs/common';
import { PostService } from './post.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';

@Controller('user/posts')
export class PostController {
  constructor(private readonly postService: PostService) { }

  @Get()
  async findAll(@Req() req) {
    const userId = 'cmc0017yi0000ws5cqy5qybiy'
    return this.postService.findAll(userId);
  }

  @Get(':id')
  async findOne(@Req() req, @Param('id') id: string) {
    const userId = 'cmc0017yi0000ws5cqy5qybiy'
    return this.postService.findOne(userId, id);
  }

  @Patch(':id/review')
  async reviewPost(
    @Req() req,
    @Param('id') id: string,
    @Body('status') status: 1 | 2,
    @Body('feedback') feedback?: string,
  ) {
    const userId = 'cmc0017yi0000ws5cqy5qybiy'
    return this.postService.reviewPost(userId, id, status, feedback);
  }
}
