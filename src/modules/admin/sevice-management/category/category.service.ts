import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category';

@Injectable()
export class CategoryService {
  constructor(private readonly prisma: PrismaService) {}

  // Create category
  async create(dto: CreateCategoryDto) {
    try {
      return await this.prisma.category.create({
        data: {
          name: dto.name,
          slug: dto.slug,
          status: dto.status,
        },
      });
    } catch (error) {
      console.error('Error creating category:', error);
      throw new InternalServerErrorException('Failed to create category');
    }
  }

  // Get all categories
  async findAll() {
    try {
      return await this.prisma.category.findMany({
        where: { deleted_at: null },
        include: { services: true, service_categories: true },
      });
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw new InternalServerErrorException('Failed to fetch categories');
    }
  }

  // Get single category
  async findOne(id: string) {
    try {
      const cate = await this.prisma.category.findUnique({
        where: { id },
      });

      if (!cate || cate.deleted_at !== null) {
        throw new NotFoundException(`Category ${id} not found or has been deleted`);
      }

      return cate;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Error fetching category:', error);
      throw new InternalServerErrorException('Failed to fetch category');
    }
  }

  // Soft delete category
  async remove(id: string) {
    try {
      await this.findOne(id); // Ensure it exists
  
      await this.prisma.category.update({
        where: { id },
        data: {
          deleted_at: new Date(),
          status: 0,
        },
      });
  
      return {
        success: true,
        message: 'Category deleted successfully',
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Error deleting category:', error);
      throw new InternalServerErrorException('Failed to delete category');
    }
  }
  
}
