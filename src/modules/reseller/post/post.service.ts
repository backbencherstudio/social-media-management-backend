import { Injectable } from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PrismaService } from '../../../prisma/prisma.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { cliPluginError } from 'nest-commander/src/constants';

@Injectable()
export class PostService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('post-schedule') private postQueue: Queue,
  ) { }

  async create(createPostDto: CreatePostDto, mediaFiles?: Express.Multer.File[]) {
    console.log("post_channels", createPostDto);
    try {
      // Create the post
      const post = await this.prisma.post.create({
        data: {
          content: createPostDto.content,
          schedule_at: createPostDto.schedule_at,
          hashtags: createPostDto.hashtags,
          status: 1, // 1 = scheduled
        },
      });

      // Create post channels if provided
      if (createPostDto.post_channels?.length) {
        await this.prisma.postChannel.createMany({
          data: createPostDto.post_channels.map((channel) => ({
            post_id: post.id,
            channel_id: channel.channel_id,
          })),
        });
      }

      // Create post files if provided
      if (createPostDto.post_files?.length) {
        await this.prisma.postFile.createMany({
          data: createPostDto.post_files.map((file) => ({
            post_id: post.id,
            name: file.name,
            type: file.type,
            file_path: file.file_path,
            file_alt: file.file_alt,
          })),
        });
      }

      // If schedule_at is provided, add to queue
      if (createPostDto.schedule_at) {
        const delay = createPostDto.schedule_at.getTime() - Date.now();
        if (delay > 0) {
          await this.postQueue.add(
            'publish-post',
            { postId: post.id },
            { delay },
          );
        } else {
          // If schedule time is in the past, publish immediately
          await this.postQueue.add('publish-post', { postId: post.id });
        }
      } else {
        // If no schedule time, publish immediately
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
              channel: true
            }
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
            data: create.map(channel => ({
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
            where: { id: { in: remove.map(item => item.id) } },
          });
        }
      }

      // Handle post files updates
      if (updatePostDto.post_files) {
        const { create, update, delete: remove } = updatePostDto.post_files;

        if (create?.length) {
          await this.prisma.postFile.createMany({
            data: create.map(file => ({
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
            where: { id: { in: remove.map(item => item.id) } },
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
          deleted_at: null,
        },
        include: {
          post_channels: { include: { channel: true } },
          post_files: true,
        },
        orderBy: { schedule_at: 'asc' }
      });
      return { success: true, data: posts };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
  
}
