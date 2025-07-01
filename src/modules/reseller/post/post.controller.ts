import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  BadRequestException,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { PostService } from './post.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { TwitterService } from '../../socials/platforms/twitter.service';

@Controller('post')
export class PostController {
  constructor(
    private readonly postService: PostService,
    private readonly twitterService: TwitterService,
  ) { }

  @Post()
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'files', maxCount: 10 }], {
      storage: memoryStorage(),
    }),
  )
  async create(
    @Body() body: any,
    @UploadedFiles() files: { files?: Express.Multer.File[] },
  ) {
    let createPostDto: CreatePostDto;
    // If data is sent as JSON string inside `body.data`, parse it
    if (body?.data) {

      createPostDto = JSON.parse(body.data);
    } else {
      createPostDto = body;
    }

    return this.postService.create(createPostDto, files?.files || []);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.postService.findOne(id);
  }

  @Get('user/:userId')
  findAllUserPost(@Param('userId') userId: string) {
    return this.postService.findAllUserPost(userId);
  }

  @Get('calendar/:userId')
  async getScheduledPosts(
    @Query('start') start: string,
    @Query('end') end: string,
    @Param('userId') userId: string,
  ) {
    try {
      const startDate = new Date(start);
      const endDate = new Date(end);

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return { success: false, message: 'Invalid start or end date' };
      }

      return await this.postService.getScheduledPostsForCalendar(
        startDate,
        endDate,
        userId,
      );
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  @Get('upcoming/:userId')
  getUpcomingPosts(@Param('userId') userId: string) {
    return this.postService.getUpcomingPosts(userId);
  }

  @Get('publish/:userId')
  getServerPublishedPosts(@Param('userId') userId: string) {
    return this.postService.getServerPublishedPosts(userId);
  }

  @Get('analysis/:userId')
  getPostStats(@Param('userId') userId: string) {
    return this.postService.getPostStats(userId)
  }

  @Patch(':id/review')
  reviewPost(
    @Param('id') id: string,
    @Body() body: { status: 1 | 2; feedback?: string },
  ) {
    return this.postService.reviewPost(id, body.status, body.feedback);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePostDto: UpdatePostDto) {
    return this.postService.update(id, updatePostDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.postService.remove(id);
  }
}
