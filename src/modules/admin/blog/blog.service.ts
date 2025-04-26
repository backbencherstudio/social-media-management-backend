import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateBlogDto } from './dto/create-blog-dto';
import { UpdateBlogDto } from './dto/update-blog-dto';
import { NotFoundException } from '@nestjs/common';


@Injectable()
export class BlogService {
  update: any;
  constructor(private readonly prisma: PrismaService) {}

  //create category
async create(dto: CreateBlogDto) {
    const {
      hashtags = [],
      title,
      content,
      content_type,
      cover_image,
      is_published,
      blocks = [],
    } = dto;
  
    try {
      // 1. Create the blog
      const blog = await this.prisma.blog.create({
        data: {
          title, // main titke
          hashtags, // has tags 
          status: is_published ? 1 : 0,
        },
      });
  
      // 2. Create the main blog content
      const mainContent = await this.prisma.blogContent.create({
        data: {
          blog_id: blog.id, // id 
          content_type: content_type || 'text',
          content: content || '',
          blog_files: {
            create: cover_image
              ? [
                  {
                    type: 'image',
                    file_path: cover_image,
                    file_alt: 'Cover Image',
                  },
                ]
              : [],
          },
        },
        include: {
          blog_files: true, // it will save in flog files
        },
      });
  
      // 3. Create additional blocks and collect their data with IDs
      const createdBlocks = [];
  
      for (const block of blocks) {
        const createdBlock = await this.prisma.blogContent.create({
          data: {
            blog_id: blog.id, // extra addon contents 
            content_type: block.content_type || 'text',
            content: block.content || '',
            blog_files: {
              create: block.cover_image
                ? [
                    {
                      type: 'image',
                      file_path: block.cover_image,
                    },
                  ]
                : [],
            },
          },
          include: {
            blog_files: true,
          },
        });
  
        createdBlocks.push({
          id: createdBlock.id,
          content: createdBlock.content,
          content_type: createdBlock.content_type,
          cover_image: createdBlock.blog_files[0]?.file_path || null,
        });
      }
  
      // 4. Return full response
      return {
        message: 'Blog created successfully',
        data: {
          blog_id: blog.id,
          blog_content_id: mainContent.id,
          title: blog.title,
          hashtags: blog.hashtags,
          content: mainContent.content,
          content_type: mainContent.content_type,
          is_published: blog.status === 1,
          cover_image: mainContent.blog_files[0]?.file_path || null,
          blocks: createdBlocks,
        },
      };
    } catch (error) {
      console.error('Error creating blog:', error);
      throw new Error('Failed to create blog. Please try again later.');
    }
}
 //get all category
async findAll() {
  try {
    const blogs = await this.prisma.blog.findMany({
      where: { deleted_at: null },
      orderBy: { created_at: 'desc' },
      include: {
        blog_blog_categories: {
          include: {
            blog_category: true,
          },
        },
      },
    });

    if (!blogs.length) {
      return {
        message: 'No blogs found / Currently blogs are empty',
        data: [],
      };
    }

    return {
      message: 'Blogs fetched successfully',
      data: blogs,
    };
  } catch (error) {
    console.error('Error fetching blogs:', error);
    throw new Error('Failed to fetch blogs. Please try again later.');
  }
}
//get one category with id
async findOne(id: string) {
  try {
    // 1. Get the blog
    const blog = await this.prisma.blog.findUnique({
      where: { id },
    });

    if (!blog || blog.deleted_at !== null) {
      throw new NotFoundException('Blog not found or has been deleted.');
    }

    // 2. Get all blog contents (main + blocks)
    const contents = await this.prisma.blogContent.findMany({
      where: { blog_id: id, deleted_at: null },
      orderBy: { created_at: 'asc' },
      include: {
        blog_files: true,
      },
    });

    // 3. Separate main content from blocks
    const mainContent = contents.length > 0 ? contents[0] : null;
    const blocks: any[] = [];

    if (contents.length > 1) {
      for (let i = 1; i < contents.length; i++) {
        const block = contents[i];
        blocks.push({
          content: block.content,
          content_type: block.content_type,
          cover_image: block.blog_files[0]?.file_path || null,
        });
      }
    }

    // 4. Return the structured response
    return {
      blog_id: blog.id,
      title: blog.title,
      hashtags: blog.hashtags,
      is_published: blog.status === 1,
      content: mainContent?.content || null,
      content_type: mainContent?.content_type || null,
      cover_image: mainContent?.blog_files[0]?.file_path || null,
      blocks,
    };
  } catch (error) {
    console.error('Error fetching blog:', error);
    if (error instanceof NotFoundException) {
      throw error;
    }
    throw new Error('Failed to fetch blog. Please try again later.');
  }
}
// update a category 
async update_blog(id: string, dto: UpdateBlogDto) {
  try {
    // 1. Verify blog exists
    const blog = await this.prisma.blog.findUnique({ where: { id } });
    if (!blog || blog.deleted_at !== null) { // checking here if a blog found or not
      throw new NotFoundException('Blog not found or has been deleted.');
    }

    // 2. Get main blog content (first by created_at)
    const mainContent = await this.prisma.blogContent.findFirst({
      where: { blog_id: id},
      orderBy: { created_at: 'asc' },
      include: { blog_files: true },
    });

    if (!mainContent) {
      return {
        success: false,
        message: 'Main blog content not found. Cannot update blog.',
      };
    }

    // 3. Update blog title and hastags
    await this.prisma.blog.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.hashtags !== undefined && { hashtags: dto.hashtags }),
        ...(dto.is_published !== undefined && { status: dto.is_published ? 1 : 0 }),
      },
    });

    // 4. Update main content
    await this.prisma.blogContent.update({
      where: { id: mainContent.id },
      data: {
        ...(dto.content !== undefined && { content: dto.content }),
        ...(dto.content_type !== undefined && { content_type: dto.content_type }),
      },
    });

    // 5. Update main cover image (only if exists)
    if (dto.cover_image !== undefined) {
      const mainCoverFile = mainContent.blog_files[0];
      if (mainCoverFile) {
        await this.prisma.blogFile.update({
          where: { id: mainCoverFile.id },
          data: {
            file_path: dto.cover_image,
            file_alt: 'Cover Image',
          },
        });
      }
    }

    // 6. Update blocks
    const updatedBlocks = [];

    if (dto.blocks?.length) {
      for (const block of dto.blocks) {
        if (!block.id) continue;

        const existingBlock = await this.prisma.blogContent.findUnique({
          where: { id: block.id },
          include: { blog_files: true },
        });

        if (!existingBlock) continue;

        await this.prisma.blogContent.update({
          where: { id: block.id },
          data: {
            ...(block.content !== undefined && { content: block.content }),
            ...(block.content_type !== undefined && { content_type: block.content_type }),
            ...(block.sort_order !== undefined && { sort_order: block.sort_order }),
          },
        });

        if (block.cover_image !== undefined) {
          const blockFile = existingBlock.blog_files[0];
          if (blockFile) {
            await this.prisma.blogFile.update({
              where: { id: blockFile.id },
              data: {
                file_path: block.cover_image,
              },
            });
          }
        }

        updatedBlocks.push({
          id: block.id,
          content: block.content,
          content_type: block.content_type,
          cover_image: block.cover_image,
        });
      }
    }
// fully returned to check 
    return {
      success: true,
      message: 'Blog updated successfully',
      data: {
        blog_id: blog.id,
        blog_content_id: mainContent.id,
        title: dto.title ?? blog.title,
        hashtags: dto.hashtags ?? blog.hashtags,
        is_published: dto.is_published ?? blog.status === 1,
        content: dto.content ?? mainContent.content,
        content_type: dto.content_type ?? mainContent.content_type,
        cover_image: dto.cover_image ?? (mainContent.blog_files[0]?.file_path || null),
        blocks: updatedBlocks,
      },
    };
  } catch (error) {
    console.error('Error updating blog:', error);

    if (error instanceof NotFoundException) {
      throw error;
    }

    throw new Error('Failed to update blog. Please try again later.');
  }
}
//softly delete a category
async softDelete(id: string) {
  try {
    const blog = await this.prisma.blog.findUnique({ where: { id } });

    if (!blog || blog.deleted_at !== null) {
      throw new NotFoundException('Blog not found or already deleted.');
    }

    await this.prisma.blog.update({
      where: { id },
      data: { deleted_at: new Date() },
    });

    return { message: 'Blog soft-deleted' };
  } catch (error) {
    console.error('Error during soft delete:', error);

    if (error instanceof NotFoundException) {
      throw error;
    }

    throw new Error('Failed to soft-delete blog. Please try again later.');
  }
}
}
  


