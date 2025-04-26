import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
} from '@nestjs/common';
import { BlogService } from './blog.service';
import { CreateBlogDto } from './dto/create-blog-dto';
import { UpdateBlogDto } from './dto/update-blog-dto';
import { ApiParam, ApiOperation, ApiResponse } from '@nestjs/swagger';

@Controller('blogs')
export class BlogController {
  constructor(private readonly blogService: BlogService) {}

  // Create a blog
  @Post()
@ApiOperation({ summary: 'Create a new blog post' })
@ApiResponse({
  status: 201,
  description: 'Blog created successfully',
  schema: {
    example: {
      message: 'Blog created successfully',
      data: {
        blog_id: 'cm9xpmgzk0000rejw29g3ah9l',
        blog_content_id: 'cm9xpmhfo0002rejwi6bhzlni',
        title: 'Testing blog',
        hashtags: ['technology', 'coding', 'Test'],
        content: 'Testing blog content.',
        content_type: 'text',
        is_published: true,
        cover_image: '/uploads/images/main picture.jpg',
        blocks: [
          {
            id: 'cm9xpmjo00005rejwuy36nxjf',
            content: 'I am testing.',
            content_type: 'added text testing',
            cover_image: '/uploads/images/addedImageForTesting.jpg',
          },
        ],
      },
    },
  },
})
  async create(@Body() dto: CreateBlogDto) {
    return await this.blogService.create(dto);
  }

  // Get all blogs
  @Get('allblogs')
  @ApiOperation({ summary: 'Get all blogs' })
  @ApiResponse({
    status: 200,
    description: 'All blogs fetched successfully',
    schema: {
      example: {
        message: 'Blogs fetched successfully',
        data: [
          {
            blog_id: 'cm9xpmgzk0000rejw29g3ah9l',
            blog_content_id: 'cm9xpmhfo0002rejwi6bhzlni',
            title: 'Testing blog',
            hashtags: ['technology', 'coding', 'Test'],
            content: 'Testing blog content.',
            content_type: 'text',
            is_published: true,
            cover_image: '/uploads/images/main picture.jpg',
            blocks: [
              {
                id: 'cm9xpmjo00005rejwuy36nxjf',
                content: 'I am testing.',
                content_type: 'added text testing',
                cover_image: '/uploads/images/addedImageForTesting.jpg',
              },
            ],
          },
        ],
      },
    },
  })
  async findAll() {
    return await this.blogService.findAll();
  }

  // Get a single blog
  @Get(':id')
  @ApiOperation({ summary: 'Get a single blog by ID' })
@ApiParam({ name: 'id', required: true, description: 'Blog ID' })
@ApiResponse({
  status: 200,
  description: 'Blog fetched successfully',
  schema: {
    example: {
      blog_id: 'cm9xpmgzk0000rejw29g3ah9l',
      blog_content_id: 'cm9xpmhfo0002rejwi6bhzlni',
      title: 'Testing blog',
      hashtags: ['technology', 'coding', 'Test'],
      content: 'Testing blog content.',
      content_type: 'text',
      is_published: true,
      cover_image: '/uploads/images/main picture.jpg',
      blocks: [
        {
          id: 'cm9xpmjo00005rejwuy36nxjf',
          content: 'I am testing.',
          content_type: 'added text testing',
          cover_image: '/uploads/images/addedImageForTesting.jpg',
        },
      ],
    },
  },
})
@ApiResponse({
  status: 404,
  description: 'Blog not found',
  schema: {
    example: {
      success: false,
      message: {
        message: 'Blog not found or has been deleted.',
        error: 'Not Found',
        statusCode: 404,
      },
    },
  },
})
  async findOne(@Param('id') id: string) {
    return await this.blogService.findOne(id);
  }

  // Update a blog
  @Put(':id')
@ApiOperation({ summary: 'Update a blog by ID' })
@ApiParam({ name: 'id', description: 'Blog ID to update' })
@ApiResponse({
  status: 200,
  description: 'Blog updated successfully',
  schema: {
    example: {
      success: true,
      message: 'Blog updated successfully',
      data: {
        blog_id: 'cm9xpmgzk0000rejw29g3ah9l',
        blog_content_id: 'cm9xpmhfo0002rejwi6bhzlni',
        title: 'Updated blog title',
        hashtags: ['updated', 'blog', 'tags'],
        content: 'Updated content.',
        content_type: 'text',
        is_published: true,
        cover_image: '/uploads/images/updated-cover.jpg',
        blocks: [
          {
            id: 'cm9xpmjo00005rejwuy36nxjf',
            content: 'Updated block content.',
            content_type: 'paragraph',
            cover_image: '/uploads/images/updated-block-image.jpg',
          },
        ],
      },
    },
  },
})
@ApiResponse({
  status: 404,
  description: 'Blog not found or deleted',
  schema: {
    example: {
      success: false,
      message: {
        message: 'Blog not found or has been deleted.',
        error: 'Not Found',
        statusCode: 404,
      },
    },
  },
})
  async update(@Param('id') id: string, @Body() dto: UpdateBlogDto) {
    return await this.blogService.update_blog(id, dto);
  }

  // Soft delete a blog
  @Delete(':id')
@ApiOperation({ summary: 'Soft delete a blog by ID' })
@ApiParam({ name: 'id', description: 'ID of the blog to delete' })
@ApiResponse({
  status: 200,
  description: 'Blog soft-deleted successfully',
  schema: {
    example: {
      message: 'Blog soft-deleted',
    },
  },
})
@ApiResponse({
  status: 404,
  description: 'Blog not found or already deleted',
  schema: {
    example: {
      success: false,
      message: {
        message: 'Blog not found or already deleted.',
        error: 'Not Found',
        statusCode: 404,
      },
    },
  },
})
  async softDelete(@Param('id') id: string) {
    return await this.blogService.softDelete(id);
  }
}
