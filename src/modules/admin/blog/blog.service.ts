import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateBlogDto } from './dto/create-blog.dto';
import { UpdateBlogDto } from './dto/update-blog.dto';
import { ContentType } from './dto/create-blog-content.dto';

@Injectable()
export class BlogService {
  constructor(private readonly prisma: PrismaService) { }

  async create(dto: CreateBlogDto) {
    const { title, hashtags, categoryIds = [], contents = [] } = dto;

    try {
      // 1. Validate category IDs
      const existing = await this.prisma.blogCategory.findMany({
        where: { id: { in: categoryIds } },
        select: { id: true },
      });
      const existingIds = existing.map((c) => c.id);
      const missing = categoryIds.filter((id) => !existingIds.includes(id));
      if (missing.length) {
        throw new BadRequestException(
          `Category not found for ID(s): ${missing.join(', ')}`
        );
      }

      // 2. Create blog
      const blog = await this.prisma.blog.create({
        data: {
          title,
          hashtags,
          blog_blog_categories: {
            create: categoryIds.map((id) => ({
              blog_category: { connect: { id } },
            })),
          },
          blog_contents: {
            create: contents.map((c) => ({
              content_type: c.contentType,
              content: c.content,
              ...(c.contentType === 'media'
                ? { blog_files: { create: [{}] } }
                : {}),
            })),
          },
        },
        select: {
          id: true,
          title: true,
          hashtags: true,
          blog_blog_categories: {
            select: {
              blog_category: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          blog_contents: {
            select: {
              id: true,
              content_type: true,
              content: true,
              blog_files: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      });


      const categories = blog.blog_blog_categories.map(({ blog_category }) => ({
        id: blog_category.id,
        name: blog_category.name,
      }));

      const contentsa = blog.blog_contents.map(content => {
        const isMedia = content.content_type === 'media';
        return {
          id: content.id,
          content_type: content.content_type,
          content: isMedia
            ? content.blog_files?.[0]?.name ?? 'image.jpg'
            : content.content,
        };
      });

      return {
        message: 'Created successfully',
        blog_id: blog.id,
        title: blog.title,
        hashtags: blog.hashtags,
        categories,
        contentsa,
      };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException(error.message || 'Blog creation failed');
    }

  }
  async findOne(id: string) {
    try {
      const blog = await this.prisma.blog.findUnique({
        where: { id },
        include: {
          blog_blog_categories: { include: { blog_category: true } },
          blog_contents: { include: { blog_files: true } },
        },
      });
      if (!blog) throw new NotFoundException(`Blog ${id} not found`);
      return blog;
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException(error.message || 'failed to find one');
    }

  }
  async update(id: string, dto: UpdateBlogDto) {
    await this.findOne(id); // checking blog exists or not 

    const { title, hashtags, categoryIds, contents } = dto;

    try {
      const updated = await this.prisma.blog.update({
        where: { id },
        data: {
          title,
          hashtags,
          ...(categoryIds
            ? {
              blog_blog_categories: {
                deleteMany: {},
                create: categoryIds.map(cid => ({ blog_category_id: cid })),
              },
            }
            : {}),
          ...(contents
            ? {
              blog_contents: {
                deleteMany: {},
                create: contents.map(c => ({
                  content_type: c.contentType,
                  content: c.content,

                })),
              },
            }
            : {}),
        },
        select: {
          id: true,
          title: true,
          hashtags: true,
          blog_blog_categories: {
            select: {
              blog_category: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          blog_contents: {
            select: {
              id: true,
              content_type: true,
              content: true,

              blog_files: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      });
      return {
        message: 'Updated successfully',
        blog_id: updated.id,
        title: updated.title,
        hashtags: updated.hashtags,
        categories: updated.blog_blog_categories.map(({ blog_category }) => ({
          id: blog_category.id,
          name: blog_category.name,
        })),
        contents: updated.blog_contents.map(content => {
          const isMedia = content.content_type === ContentType.MEDIA;

          return {
            id: content.id,
            content_type: `${content.content_type} updated`,
            content: isMedia
              ? content.blog_files?.[0]?.name || 'default.jpg'
              : content.content,
          };
        }),
      };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException(error.message || 'Blog Updation failed');
    }



  }
  async findAll() {
    try {
      const blogs = await this.prisma.blog.findMany({
        where: { deleted_at: null },
        orderBy: { created_at: 'desc' },
        select: {
          id: true,
          title: true,
          hashtags: true,
          blog_blog_categories: {
            select: {
              blog_category: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          blog_contents: {
            select: {
              id: true,
              content_type: true,
              content: true,
              blog_files: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      });

      return blogs.map(blog => {
        const categories = blog.blog_blog_categories.map(({ blog_category }) => ({
          id: blog_category.id,
          name: blog_category.name,
        }));

        const contents = blog.blog_contents.map(content => ({
          id: content.id,
          content_type: content.content_type,
          content:
            content.content_type === 'media'
              ? content.blog_files?.[0]?.name ?? 'image.jpg'
              : content.content,
        }));

        return {
          message: 'Fetched successfully',
          blog_id: blog.id,
          title: blog.title,
          hashtags: blog.hashtags,
          categories,
          contents,
        };
      });
    } catch (error) {
      console.error('Find all failed:', error);
      return {
        message: 'Fetch failed',
        error: error.message,
      };
    }
  }
  async remove(id: string) {
    try {
      const blog = await this.prisma.blog.findUnique({ where: { id } });

      if (!blog) {
        throw new NotFoundException('Blog not found or already deleted');
      }

      // Delete related categories and contents first
      await this.prisma.blogBlogCategory.deleteMany({
        where: { blog_id: id },
      });

      await this.prisma.blogContent.deleteMany({
        where: { blog_id: id },
      });

      await this.prisma.blog.delete({ where: { id } });

      return {
        message: 'Deleted successfully',
        blog_id: id,
      };

    } catch (error) {
      if (error) {
        return {
          message: "Blog not found or already deleted"
        }
      }
    }

  }

}
