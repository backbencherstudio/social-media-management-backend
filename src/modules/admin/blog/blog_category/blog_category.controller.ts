import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Delete,
} from '@nestjs/common';
import { BlogCategoryService } from './blog_category.service';
import { CreateBlogCategoryDto } from './dto/create_blog_category';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('BlogCategory')
@Controller('blog-categories')
export class BlogCategoryController {
  constructor(private readonly service: BlogCategoryService) {}

  @Post()
  @ApiOperation({ summary: 'Create a blog category' })
  @ApiResponse({
    status: 201,
    description: 'Blog category created successfully',
    schema: {
      example: {
        message: 'Blog category created successfully',
        data: {
          id: 'cm9tslk950001re7cr92x0464',
        },
      },
    },
  })
  create(@Body() dto: CreateBlogCategoryDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all blog categories' })
  @ApiResponse({ status: 200, description: 'All blog categories fetched' })
  findAll() {
    return this.service.findAll();
  }


  @Get(':id')
  @ApiOperation({ summary: 'Get a blog category by ID' })
  @ApiResponse({
    status: 200,
    description: 'Blog category fetched successfully',
    schema: {
      example: {
        id: 'cm9xsmkk00000re88s21a1l77',
        created_at: '2025-04-26T05:41:57.265Z',
        updated_at: '2025-04-26T05:41:57.265Z',
        deleted_at: null,
        status: 1,
        name: 'Social Media Marketing 21aaaa',
        slug: 'social-media-marketing a12aaa',
      },
    },
  })
  
  @ApiResponse({
    status: 404,
    description: 'Blog category not found',
    schema: {
      example: {
        success: false,
        message: {
          message: 'Blog category with ID cm9tr7xiv0000recsm8c3gt86 not found',
          error: 'Not Found',
          statusCode: 404,
        },
      },
    },
  })  
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }




  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete a blog category' })
  @ApiResponse({ status: 200, description: 'Blog category soft-deleted' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
