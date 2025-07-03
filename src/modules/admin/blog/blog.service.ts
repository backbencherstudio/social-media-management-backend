import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateBlogDto } from './dto/create-blog.dto';
import { UpdateBlogDto } from './dto/update-blog.dto';
import { ContentType } from './dto/create-blog-content.dto';
import appConfig from 'src/config/app.config';
import { SojebStorage } from 'src/common/lib/Disk/SojebStorage';

@Injectable()
export class BlogService {
  constructor(private readonly prisma: PrismaService) { }

//updated create with multiple imgae and vidoes 
async create(dto: CreateBlogDto, files: Express.Multer.File[]) {
  const { title, hashtags, categoryIds = [], contents = [] } = dto;

  try {
    // Validate and create the blog categories, and contents
    const blog = await this.prisma.blog.create({
      data: {
        title,
        hashtags,
         status: dto.status || false,
        blog_blog_categories: {
          create: categoryIds.map((id) => ({
            blog_category: { connect: { id } },
          })),
        },
        blog_contents: {
          create: contents.map((content) => ({
            content_type: content.contentType,
            content: content.content,
            ...(content.contentType === 'media'
              ? { blog_files: { create: [{}] } }
              : {}),
          })),
        },
      },
      include: {
        blog_blog_categories: { include: { blog_category: true } },
        blog_contents: { include: { blog_files: true } },
      },
    });

    // Handling multiple file uploads
    let fileIndex = 0;
    for (let content of blog.blog_contents) {
      if (content.content_type === 'media' && files[fileIndex]) {
        const blogFile = content.blog_files[0];

        const randomName = Array(32)
          .fill(null)
          .map(() => Math.round(Math.random() * 16).toString(16))
          .join('');
        const fileName = `${randomName}${files[fileIndex].originalname}`;
        const storagePath = appConfig().storageUrl.blog + '/' + fileName;

        // Upload the image to storage
        await SojebStorage.put(storagePath, files[fileIndex].buffer);

        // Update the file data in the database
        await this.prisma.blogFile.update({
          where: { id: blogFile.id },
          data: {
            name: files[fileIndex].originalname,
            size: files[fileIndex].size,
            file_path: storagePath,
            file_alt: content.content,
          },
        });

        // Update in-memory object for response
        blogFile.name = files[fileIndex].originalname;
        blogFile.size = files[fileIndex].size;
        blogFile.file_path = storagePath;
        blogFile.file_alt = content.content;

        // Move to the next file
        fileIndex++;
      }
    }

    // Map the categories and contents for the response
    const categories = blog.blog_blog_categories.map(({ blog_category }) => ({
      id: blog_category.id,
      name: blog_category.name,
    }));

    const contentsa = blog.blog_contents.map((content) => {
      const isMedia = content.content_type === 'media';
      const file = content.blog_files?.[0];

      return {
        id: content.id,
        content_type: content.content_type,
        content:
          isMedia && file?.file_path
            ? SojebStorage.url(file.file_path)
            : content.content,
      };
    });

    return {
      message: 'Created successfully',
      blog_id: blog.id,
      status:blog.status,
      title: blog.title,
      hashtags: blog.hashtags,
      categories,
      contentsa,
    };
  } catch (error) {
    if (error instanceof BadRequestException) throw error;
    throw new InternalServerErrorException(
      error.message || 'Blog creation failed',
    );
  }
 }


//Find one 
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
  //find all
  async findAll() {
    try {
      const blogs = await this.prisma.blog.findMany({
        where: { deleted_at: null },
        orderBy: { created_at: 'desc' },
        select: {
          id: true,
          status:true,
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

                  file_path:true
                },
              },
            },
          },
        },
      });

      return blogs.map(blog => {
        const categories = blog.blog_blog_categories.map(({ blog_category }) => ({
          id: blog_category.id,
        status:blog.status,
          name: blog_category.name,
        }));

        const contents = blog.blog_contents.map(content => ({
          id: content.id,
          content_type: content.content_type,
          content:
            content.content_type === 'media'
              ? content.blog_files?.[0]?.file_path ?? 'image.jpg'
              : content.content,
        }));

        return {
          message: 'Fetched successfully',
          blog_id: blog.id,
          status: blog.status,
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
  //remove
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

//update
async update(id: string, dto: UpdateBlogDto, files: Express.Multer.File[]) {
  const { title, hashtags, categoryIds, contents } = dto;

  try {
    const existingBlog = await this.prisma.blog.findUnique({
      where: { id },
      include: {
        blog_blog_categories: true,
        blog_contents: { include: { blog_files: true } },
      },
    });

    if (!existingBlog) {
      throw new NotFoundException(`Blog with ID ${id} not found`);
    }

    // 1. Update title / hashtags (if provided)
    if (title || hashtags) {
      await this.prisma.blog.update({
        where: { id },
        data: {
          ...(title && { title }),
          ...(hashtags && { hashtags }),
        },
      });
    }

    //  2. Update categories (if provided)
    if (Array.isArray(categoryIds)) {
      await this.prisma.blogBlogCategory.deleteMany({ where: { blog_id: id } });

      if (categoryIds.length > 0) {
        await this.prisma.blogBlogCategory.createMany({
          data: categoryIds.map((cid) => ({
            blog_id: id,
            blog_category_id: cid,
          })),
        });
      }
    }

    //  3. Update contents (if provided)
    if (Array.isArray(contents)) {
      await this.prisma.blogContent.deleteMany({ where: { blog_id: id } });

      let fileIndex = 0;

      for (const c of contents) {
        const content = await this.prisma.blogContent.create({
          data: {
            blog_id: id,
            content_type: c.contentType,
            content: c.content,
            ...(c.contentType === 'media' ? { blog_files: { create: [{}] } } : {}),
          },
          include: { blog_files: true },
        });

        // Upload file if content is media
        if (c.contentType === 'media' && files[fileIndex]) {
          const file = files[fileIndex];
          const blogFile = content.blog_files[0];

          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          const fileName = `${randomName}${file.originalname}`;
          const storagePath = appConfig().storageUrl.blog + '/' + fileName;

          await SojebStorage.put(storagePath, file.buffer);

          await this.prisma.blogFile.update({
            where: { id: blogFile.id },
            data: {
              name: file.originalname,
              size: file.size,
              file_alt: c.content,
              file_path: storagePath,
            },
          });

          fileIndex++;
        }
      }
    }

    //4. Final response
    const updated = await this.prisma.blog.findUnique({
      where: { id },
      include: {
        blog_blog_categories: { include: { blog_category: true } },
        blog_contents: { include: { blog_files: true } },
      },
    });

    const categories = updated.blog_blog_categories.map(({ blog_category }) => ({
      id: blog_category.id,
      name: blog_category.name,
    }));

    const contentResponse = updated.blog_contents.map((c) => {
      const isMedia = c.content_type === 'media';
      const file = c.blog_files?.[0];
      return {
        id: c.id,
        content_type: c.content_type,
        content: isMedia && file ? SojebStorage.url(file.file_path) : c.content,
      };
    });

    return {
      message: 'Updated successfully',
      blog_id: updated.id,
      title: updated.title,
      hashtags: updated.hashtags,
      categories,
      contents: contentResponse,
    };

  } catch (error) {
    console.error('[❌ Blog Update Error]', error);
    throw new InternalServerErrorException(error.message || 'Update failed');
  }
}
//drafts
async findDrafts() {
  try {
    const drafts = await this.prisma.blog.findMany({
      where: {
        status: false,
        deleted_at: null,
      },
      orderBy: { created_at: 'desc' },
      include: {
        blog_blog_categories: { include: { blog_category: true } },
        blog_contents: { include: { blog_files: true } },
      },
    });

    return drafts.map(blog => {
      const categories = blog.blog_blog_categories.map(({ blog_category }) => ({
        id: blog_category.id,
        name: blog_category.name,
      }));

      const contents = blog.blog_contents.map(content => ({
        id: content.id,
        content_type: content.content_type,
        content:
          content.content_type === 'media'
            ? content.blog_files?.[0]?.file_path ?? 'image.jpg'
            : content.content,
      }));

      return {
        status:"200",
        massage:"Successs",
        data:{
        blog_id: blog.id,
        title: blog.title,
        hashtags: blog.hashtags,
        status: blog.status,
        categories,
        contents,
        }
      };
    });

  } catch (error) {
    console.error('[Fetch Draft Blogs Error]', error);
    throw new InternalServerErrorException(error.message || 'Failed to fetch drafts');
  }
}

//publish 
async publishPost(id: string) {
  try {
    const blog = await this.prisma.blog.findUnique({ where: { id } });

    if (!blog) {
      throw new NotFoundException('Blog not found or already deleted');
    }

    // Update the status to true (published)
    await this.prisma.blog.update({
      where: { id },
      data: { status: true },
    });

    return {
      message: 'Published successfully',
      blog_id: id,
      status: true,
    };
  } catch (error) {
    console.error('Error publishing blog:', error);
    throw new InternalServerErrorException(error.message || 'Failed to publish blog');
  }
}




}
