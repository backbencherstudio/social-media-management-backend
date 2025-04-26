import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateBlogCategoryDto } from './dto/create_blog_category';

@Injectable()
export class BlogCategoryService {
  constructor(private readonly prisma: PrismaService) {}

  // Create
  async create(dto: CreateBlogCategoryDto) {
    try {
      const created =  await this.prisma.blogCategory.create({
        data: {
          name: dto.name,
          slug: dto.slug,
          status: dto.status ?? 1,
        },
      });

      return{
        message: 'Blog category created successfully',
        data :{id: created.id,}
      }
    } catch (error) {
      throw new InternalServerErrorException('Failed to create blog category', error?.message);
    }
  }
  // Find All
  async findAll() {
    try {
      return await this.prisma.blogCategory.findMany({
        where: { deleted_at: null },
        include: { blog_blog_categories: true },
      });
    } catch (error) {
      throw new InternalServerErrorException('Failed to retrieve blog categories', error?.message);
    }
  }
  // Find One
  async findOne(id: string) {
    try {
      const blogCategory = await this.prisma.blogCategory.findUnique({
        where: { id },
      });
      if (!blogCategory) {
        throw new NotFoundException(`Blog category with ID ${id} not found`);
      }
      return blogCategory;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Failed to retrieve blog category', error?.message);
    }
  }
  // Soft Delete
  async remove(id: string) {
    try {
      await this.findOne(id); // Will throw NotFoundException if not exists
      const deleted =  await this.prisma.blogCategory.update({
        where: { id },
        data: {
          deleted_at: new Date(),
          status: 0,
        },

      
      });
      return{
        message: 'Blog category deleted successfully',
        data :{id: deleted.id,}
    }
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Failed to delete blog category', error?.message);
    }
  }
}
