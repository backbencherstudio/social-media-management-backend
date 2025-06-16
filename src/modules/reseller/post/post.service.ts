import { Injectable } from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PrismaService } from '../../../prisma/prisma.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { SojebStorage } from 'src/common/lib/Disk/SojebStorage';

@Injectable()
export class PostService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('post-schedule') private postQueue: Queue,
  ) {}

  async create(createPostDto: CreatePostDto, files?: Express.Multer.File[]) {
    console.log('Creating post with data:', createPostDto);
    try {
      const post = await this.prisma.post.create({
        data: {
          content: createPostDto.content,
          schedule_at: createPostDto.schedule_at, // schedule input here
          hashtags: createPostDto.hashtags,
          status: 0,
        },
      });

      if (createPostDto.post_channels?.length) {
        await this.prisma.postChannel.createMany({
          data: createPostDto.post_channels.map((channel) => ({
            post_id: post.id,
            channel_id: channel.channel_id,
          })),
        });
      }

      if (files && files.length > 0) {
        const postFiles = [];

        for (const file of files) {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          const fileName = `${randomName}-${file.originalname}`;
          await SojebStorage.put('post-files/' + fileName, file.buffer);

          postFiles.push({
            post_id: post.id,
            name: file.originalname,
            type: file.mimetype.startsWith('image') ? 'image' : 'video',
            file_path: fileName,
            size: file.size,
            file_alt: '',
          });
        }

        if (postFiles.length > 0) {
          await this.prisma.postFile.createMany({
            data: postFiles,
          });
        }
      }
      // If schedule_at is provided, add to queue
      if (createPostDto.schedule_at) {
        const scheduleDate = new Date(createPostDto.schedule_at);
        const delay = scheduleDate.getTime() - Date.now();

        if (delay > 0) {
          await this.postQueue.add(
            'publish-post',
            { postId: post.id },
            { delay },
          );
        } else {
          await this.postQueue.add('publish-post', { postId: post.id });
        }
      } else {
        await this.postQueue.add('publish-post', { postId: post.id });
      }

      return { success: true, data: await this.findOne(post.id) };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  async findAll() {
    try {
      const posts = await this.prisma.post.findMany({
        include: {
          post_channels: {
            include: {
              channel: true,
            },
          },
          post_files: true,
        },
      });
      return { success: true, data: posts };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  async findOne(id: string) {
    try {
      const post = await this.prisma.post.findUnique({
        where: { id },
        include: {
          post_channels: true,
          post_files: true,
        },
      });
      return { success: true, data: post };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  async update(id: string, updatePostDto: UpdatePostDto) {
    try {
      // Handle post channels updates
      if (updatePostDto.post_channels) {
        const { create, update, delete: remove } = updatePostDto.post_channels;

        if (create?.length) {
          await this.prisma.postChannel.createMany({
            data: create.map((channel) => ({
              post_id: id,
              channel_id: channel.channel_id,
            })),
          });
        }

        if (update?.length) {
          for (const updateItem of update) {
            await this.prisma.postChannel.update({
              where: { id: updateItem.where.id },
              data: updateItem.data,
            });
          }
        }

        if (remove?.length) {
          await this.prisma.postChannel.deleteMany({
            where: { id: { in: remove.map((item) => item.id) } },
          });
        }
      }

      // Handle post files updates
      if (updatePostDto.post_files) {
        const { create, update, delete: remove } = updatePostDto.post_files;

        if (create?.length) {
          await this.prisma.postFile.createMany({
            data: create.map((file) => ({
              post_id: id,
              name: file.name,
              type: file.type,
              file_path: file.file_path,
              file_alt: file.file_alt,
            })),
          });
        }

        if (update?.length) {
          for (const updateItem of update) {
            await this.prisma.postFile.update({
              where: { id: updateItem.where.id },
              data: updateItem.data,
            });
          }
        }

        if (remove?.length) {
          await this.prisma.postFile.deleteMany({
            where: { id: { in: remove.map((item) => item.id) } },
          });
        }
      }
    } catch (error) {
      return { success: false, message: error.message };
    }
    // Update the post itself
    const { post_channels, post_files, ...postData } = updatePostDto;
    const updated = await this.prisma.post.update({
      where: { id },
      data: postData,
      include: {
        post_channels: true,
        post_files: true,
      },
    });
    return { success: true, data: updated };
  }

  async remove(id: string) {
    try {
      const deleted = await this.prisma.post.delete({
        where: { id },
      });
      return { success: true, data: deleted };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  async getScheduledPostsForCalendar(start: Date, end: Date) {
    try {
      const posts = await this.prisma.post.findMany({
        where: {
          schedule_at: {
            gte: start,
            lte: end,
          },
          status: 1, // Only get scheduled posts
          deleted_at: null,
        },
        include: {
          post_channels: { include: { channel: true } },
          post_files: true,
        },
        orderBy: { schedule_at: 'asc' },
      });
      return { success: true, data: posts };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  async getUpcomingPosts() {
    try {
      const now = new Date();

      const posts = await this.prisma.post.findMany({
        where: {
          schedule_at: {
            gt: now,
          },
          status: 1,
          deleted_at: null,
        },
        include: {
          post_channels: { include: { channel: true } },
          post_files: true,
        },
        orderBy: { schedule_at: 'asc' },
      });

      return { success: true, data: posts };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  async reviewPost(
    postId: string,
    action: 1 | 2, // 1 for approve, 2 for reject
    feedback?: string,
  ) {
    try {
      const post = await this.prisma.post.update({
        where: { id: postId },
        data: {
          status: action,
          feedback: feedback || null,
          updated_at: new Date(),
        },
      });
      // // Only queue post on approval
      // if (post.status === 1) {
      //   if (post.schedule_at) {
      //     const scheduleDate = new Date(post.schedule_at);
      //     const delay = scheduleDate.getTime() - Date.now();
      //     if (delay > 0) {
      //       await this.postQueue.add(
      //         'publish-post',
      //         { postId: post.id },
      //         { delay },
      //       );
      //     } else {
      //       await this.postQueue.add('publish-post', { postId: post.id });
      //     }
      //   } else {
      //     await this.postQueue.add('publish-post', { postId: post.id });
      //   }
      // }

      return {
        success: true,
        message: `Post update successfully`,
        data: post,
      };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
}
