import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  InternalServerErrorException,
} from '@nestjs/common';
import { BlogService } from './blog.service';
import { CreateBlogDto } from './dto/create-blog.dto';
import { UpdateBlogDto } from './dto/update-blog.dto';

@Controller('admin/blog')
export class BlogController {
  constructor(private readonly blogService: BlogService) {}

  @Post()
  async create(@Body() dto: CreateBlogDto) {
    try {
      return await this.blogService.create(dto);
    } catch (error) {
      throw new InternalServerErrorException(error.message || 'Create failed');
    }
  }
  @Get()
  async findAll() {
    try {
      return await this.blogService.findAll();
    } catch (error) {
      throw new InternalServerErrorException(error.message || 'Fetch failed');
    }
  }
  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      return await this.blogService.findOne(id);
    } catch (error) {
      throw new InternalServerErrorException(error.message || 'Not found');
    }
  }
  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateBlogDto) {
    try {
      return await this.blogService.update(id, dto);
    } catch (error) {
      throw new InternalServerErrorException(error.message || 'Update failed');
    }
  }
  @Delete(':id')
  async remove(@Param('id') id: string) {
    try {
      return await this.blogService.remove(id);
    } catch (error) {
      throw new InternalServerErrorException(error.message || 'Delete failed');
    }
  }
}
