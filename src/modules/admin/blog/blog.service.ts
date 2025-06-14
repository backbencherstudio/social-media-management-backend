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
//This is for testing
// async create(dto: CreateBlogDto, file: Express.Multer.File) {
  //   const { title, hashtags, categoryIds = [], contents = [] } = dto;

  //   try {
  //     // 1. Validate category IDs
  //     const existing = await this.prisma.blogCategory.findMany({
  //       where: { id: { in: categoryIds } },
  //       select: { id: true },
  //     });
  //     const existingIds = existing.map((c) => c.id);
  //     const missing = categoryIds.filter((id) => !existingIds.includes(id));
  //     if (missing.length) {
  //       throw new BadRequestException(
  //         `Category not found for ID(s): ${missing.join(', ')}`
  //       );
  //     }

  //     // 2. Create blog
  //     const blog = await this.prisma.blog.create({
  //       data: {
  //         title,
  //         hashtags,
  //         blog_blog_categories: {
  //           create: categoryIds.map((id) => ({
  //             blog_category: { connect: { id } },
  //           })),
  //         },
  //         blog_contents: {
  //           create: contents.map((c) => ({
  //             content_type: c.contentType,
  //             content: c.content,
  //             ...(c.contentType === 'media'
  //               ? { blog_files: { create: [{}] } }
  //               : {}),
  //           })),
  //         },
  //       },
  //       select: {
  //         id: true,
  //         title: true,
  //         hashtags: true,
  //         blog_blog_categories: {
  //           select: {
  //             blog_category: {
  //               select: {
  //                 id: true,
  //                 name: true,
  //               },
  //             },
  //           },
  //         },
  //         blog_contents: {
  //           select: {
  //             id: true,
  //             content_type: true,
  //             content: true,
  //             blog_files: {
  //               select: {
  //                 name: true,
  //                 size:true,
  //                 file_alt:true,
  //                 file_path:true,
  //               },
  //             },
  //           },
  //         },
  //       },
  //     });


  //     const categories = blog.blog_blog_categories.map(({ blog_category }) => ({
  //       id: blog_category.id,
  //       name: blog_category.name,
  //     }));

  //     const contentsa = blog.blog_contents.map(content => {
  //       const isMedia = content.content_type === 'media';
  //       return {
  //         id: content.id,
  //         content_type: content.content_type,
  //         content: isMedia
  //           ? content.blog_files?.[0]?.name ?? 'image.jpg'
  //           : content.content,
  //       };
  //     });

  //     return {
  //       message: 'Created successfully',
  //       blog_id: blog.id,
  //       title: blog.title,
  //       hashtags: blog.hashtags,
  //       categories,
  //       contentsa,
  //     };
  //   } catch (error) {
  //     if (error instanceof BadRequestException) throw error;
  //     throw new InternalServerErrorException(error.message || 'Blog creation failed');
  //   }

  // }
  /////////////////////////////////////////////
//updated create with multiple imgae and vidoes 
async create(dto: CreateBlogDto, files: Express.Multer.File[]) {
  const { title, hashtags, categoryIds = [], contents = [] } = dto;

  try {
    // Validate and create the blog categories, and contents
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
//This is for testing
// async create(dto: CreateBlogDto, file?: Express.Multer.File) {
//   const { title, hashtags, categoryIds = [], contents = [] } = dto;

//   try {
//     // 1. Validate category IDs
//     const existing = await this.prisma.blogCategory.findMany({
//       where: { id: { in: categoryIds } },
//       select: { id: true },
//     });

//     const existingIds = existing.map((c) => c.id);
//     const missing = categoryIds.filter((id) => !existingIds.includes(id));
//     if (missing.length) {
//       throw new BadRequestException(
//         `Category not found for ID(s): ${missing.join(', ')}`,
//       );
//     }

//     // 2. Create the blog with contents
//     const blog = await this.prisma.blog.create({
//       data: {
//         title,
//         hashtags,
//         blog_blog_categories: {
//           create: categoryIds.map((id) => ({
//             blog_category: { connect: { id } },
//           })),
//         },
//         blog_contents: {
//           create: contents.map((c) => ({
//             content_type: c.contentType,
//             content: c.content,
//             ...(c.contentType === 'media'
//               ? { blog_files: { create: [{}] } }
//               : {}),
//           })),
//         },
//       },
//       include: {
//         blog_blog_categories: {
//           include: { blog_category: true },
//         },
//         blog_contents: {
//           include: { blog_files: true },
//         },
//       },
//     });

//     // 3. If file exists, attach it to first media content
//     if (file) {
//       const mediaContent = blog.blog_contents.find(
//         (content) =>
//           content.content_type === 'media' &&
//           content.blog_files &&
//           content.blog_files.length > 0,
//       );

//       if (mediaContent) {
//         const blogFile = mediaContent.blog_files[0];

//         // Generate unique filename
//         const randomName = Array(32)
//           .fill(null)
//           .map(() => Math.round(Math.random() * 16).toString(16))
//           .join('');
//         const fileName = `${randomName}${file.originalname}`;

//         const storagePath = appConfig().storageUrl.blog + '/' + fileName;

//         // Upload file to storage
//         await SojebStorage.put(storagePath, file.buffer);

//         // Update blogFile with file metadata
//         await this.prisma.blogFile.update({
//           where: { id: blogFile.id },
//           data: {
//             name: file.originalname,
//             size: file.size,
//             file_alt: mediaContent.content,
//             file_path: storagePath,
//           },
//         });

//         // Update in-memory object for response mapping
//         blogFile.name = file.originalname;
//         blogFile.size = file.size;
//         blogFile.file_path = storagePath;
//         blogFile.file_alt = mediaContent.content;
//       }
//     }

//     // 4. Map categories
//     const categories = blog.blog_blog_categories.map(({ blog_category }) => ({
//       id: blog_category.id,
//       name: blog_category.name,
//     }));

//     // 5. Map content blocks, replace media content with image URL
//     const contentsa = blog.blog_contents.map((content) => {
//       const isMedia = content.content_type === 'media';
//       const file = content.blog_files?.[0];

//       return {
//         id: content.id,
//         content_type: content.content_type,
//         content:
//           isMedia && file?.file_path
//             ? SojebStorage.url(file.file_path)
//             : content.content,
//       };
//     });

//     return {
//       message: 'Created successfully',
//       blog_id: blog.id,
//       title: blog.title,
//       hashtags: blog.hashtags,
//       categories,
//       contentsa,
//     };
//   } catch (error) {
//     if (error instanceof BadRequestException) throw error;
//     throw new InternalServerErrorException(
//       error.message || 'Blog creation failed',
//     );
//   }
// }
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
  //Update
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
  //find all
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

}
