import { Injectable } from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PrismaService } from '../../../prisma/prisma.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { SojebStorage } from 'src/common/lib/Disk/SojebStorage';
import { TwitterService } from '../../socials/platforms/twitter.service';
import appConfig from 'src/config/app.config';

@Injectable()
export class PostService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('post-schedule') private postQueue: Queue,
    private twitterService: TwitterService,
  ) { }

  async create(createPostDto: CreatePostDto, files?: Express.Multer.File[]) {
    console.log('Creating post with data:', createPostDto);
    console.log('Creating post with file:', files);
    try {
      // Validate task_id if provided
      if (createPostDto.task_id) {
        const taskExists = await this.prisma.taskAssign.findUnique({
          where: { id: createPostDto.task_id },
        });

        if (!taskExists) {
          return {
            success: false,
            message: `Task with ID ${createPostDto.task_id} does not exist`
          };
        }
      }

      const post = await this.prisma.post.create({
        data: {
          content: createPostDto.content,
          schedule_at: createPostDto.schedule_at, // schedule input here
          hashtags: createPostDto.hashtags,
          task_id: createPostDto.task_id,
          status: createPostDto.status ?? 0, // allow status to be set on creation
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
      console.log("files", files)

      if (files && files.length > 0) {
        const postFiles = [];

        for (const file of files) {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          const fileName = `${randomName}-${file.originalname}`;
          await SojebStorage.put('post/' + fileName, file.buffer);

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

      // If post is created as approved (status = 1), schedule for publishing
      if (post.status === 1) {
        if (post.schedule_at) {
          const scheduleDate = new Date(post.schedule_at);
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
      }

      return {
        success: true,
        data: await this.findOne(post.id),
      };
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
          task: true
        },
      });

      // Add public URLs to post files
      const postsWithUrls = posts.map((post) => ({
        ...post,
        post_files: post.post_files.map((file) => ({
          ...file,
          file_url: SojebStorage.url(
            appConfig().storageUrl.rootUrl + '/post/' + file.file_path,
          ),
        })),
      }));

      return { success: true, data: postsWithUrls };
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
          task: true
        },
      });

      if (!post) {
        return { success: false, message: 'Post not found' };
      }

      // Add public URLs to post files
      const postWithUrls = {
        ...post,
        post_files: post.post_files.map((file) => ({
          ...file,
          file_url: SojebStorage.url(
            appConfig().storageUrl.rootUrl + '/post/' + file.file_path,
          ),
        })),
      };

      return { success: true, data: postWithUrls };
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
    return { success: true, data: await this.findOne(id) };
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

      // Add public URLs to post files
      const postsWithUrls = posts.map((post) => ({
        ...post,
        post_files: post.post_files.map((file) => ({
          ...file,
          file_url: SojebStorage.url(
            appConfig().storageUrl.rootUrl + '/post/' + file.file_path,
          ),
        })),
      }));

      return { success: true, data: postsWithUrls };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  async getUpcomingPosts() {
    try {
      const now = new Date();
      console.log(now)
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

      // Add public URLs to post files
      const postsWithUrls = posts.map((post) => ({
        ...post,
        post_files: post.post_files.map((file) => ({
          ...file,
          file_url: SojebStorage.url(
            appConfig().storageUrl.rootUrl + '/post/' + file.file_path,
          ),
        })),
      }));

      return { success: true, data: postsWithUrls };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  async reviewPost(
    postId: string,
    action: 1 | 2, // 1 = approved, 2 = rejected
    feedback?: string,
  ) {
    try {
      // Step 1: Update post status
      const post = await this.prisma.post.update({
        where: { id: postId },
        data: {
          status: action,
          feedback: feedback || null,
          updated_at: new Date(),
        },
      });

      // Step 2: If post is approved, add to queue for publishing
      if (action === 1) {
        if (post.schedule_at) {
          const scheduleDate = new Date(post.schedule_at);
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
      }

      // Step 3: Get related task via post.task_id
      const task = await this.prisma.taskAssign.findFirst({
        where: {
          posts: { some: { id: postId } }, // or use post.task_id if defined
        },
        include: {
          posts: true,
          order: {
            include: { order_assigns: true }, // get all tasks under order
          },
        },
      });

      if (task) {
        // Step 4: Check if all posts in task are approved
        const allPostsApproved = task.posts.every((p) => p.status === 1);

        if (allPostsApproved) {
          // Step 5: Update task status to Completed
          await this.prisma.taskAssign.update({
            where: { id: task.id },
            data: { status: 'completed' }, // or Status.completed enum if using
          });
        }

        // Step 6: After task completion, check if all tasks in the order are completed
        const updatedTasks = await this.prisma.taskAssign.findMany({
          where: { order_id: task.order_id },
        });

        const allTasksCompleted = updatedTasks.every(
          (t) => t.status === 'completed',
        );

        if (allTasksCompleted) {
          await this.prisma.order.update({
            where: { id: task.order_id },
            data: { order_status: 'completed' }, // Or OrderStatus.completed enum
          });
        }
      }

      return {
        success: true,
        message: 'Post reviewed and related updates applied.',
        data: post,
      };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
}
