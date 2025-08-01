import { Injectable } from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PrismaService } from '../../../prisma/prisma.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { SojebStorage } from 'src/common/lib/Disk/SojebStorage';
import { TwitterService } from '../../socials/platforms/twitter.service';
import appConfig from 'src/config/app.config';
import { FacebookService } from '../../socials/platforms/facebook.service';
import { InstagramService } from '../../socials/platforms/instagram.service';
import { NotificationRepository } from 'src/common/repository/notification/notification.repository';
import { MessageGateway } from 'src/modules/chat/message/message.gateway';

@Injectable()
export class PostService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly messageGateway: MessageGateway,
    @InjectQueue('post-schedule') private postQueue: Queue,
    private twitterService: TwitterService,
    private facebookService: FacebookService,
    private instagramService: InstagramService,
  ) { }

  async create(createPostDto: CreatePostDto, files?: Express.Multer.File[]) {
    try {
      // Validate task_id if provided

      const taskExists = await this.prisma.taskAssign.findUnique({
        where: { id: createPostDto.task_id },
      });

      if (!taskExists) {
        return {
          success: false,
          message: `Task with ID ${createPostDto.task_id} does not exist`
        };
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


      await this.prisma.taskAssign.update({
        where: { id: createPostDto.task_id },
        data: { status: 'Clint_review' },
      });


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


      const task = await this.prisma.taskAssign.findUnique({
        where: { id: createPostDto.task_id },
        include: { user: true },
      });
      if (task) {
        const reseller = await this.prisma.reseller.findUnique({
          where: { reseller_id: task.reseller_id },
        });
        const notificationPayload = {
          sender_id: reseller?.user_id,
          receiver_id: task.user_id,
          text: 'A new post has been created and assigned to you.',
          type: 'post' as const, // must be one of the allowed types
          entity_id: post.id,
        };

        await NotificationRepository.createNotification(notificationPayload);
        this.messageGateway.server.emit('notification', notificationPayload);
      }


      return {
        success: true,
        data: await this.findOne(post.id),
      };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  async findAllUserPost(userId: string) {
    console.log(userId)
    try {
      const posts = await this.prisma.post.findMany({
        where: {
          task: { user_id: userId },
        },
        select: {
          id: true,
          content: true,
          schedule_at: true,
          hashtags: true,
          status: true,
          created_at: true,
          updated_at: true,
          feedback: true,
          task_id: true,
          post_channels: {
            select: {
              id: true,
              channel: {
                select: {
                  id: true,
                  name: true,
                }
              }
            }
          },
          post_files: {
            select: {
              id: true,
              name: true,
              type: true,
              file_path: true,
              size: true,
              file_alt: true,
            }
          },
          task: {
            select: {
              id: true,
              role_name: true,
              ammount: true,
              post_count: true,
              status: true,
            }
          }
        },
      });

      // Add public URLs to post files
      const postsWithUrls = posts.map((post) => ({
        ...post,
        post_files: post.post_files.map((file) => ({
          ...file,
          file_url: SojebStorage.url(
            appConfig().storageUrl.postFile + '/' + file.file_path,
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
        select: {
          id: true,
          content: true,
          schedule_at: true,
          hashtags: true,
          status: true,
          created_at: true,
          updated_at: true,
          feedback: true,
          task_id: true,
          post_channels: {
            select: {
              id: true,
              channel: {
                select: {
                  id: true,
                  name: true,
                }
              }
            }
          },
          post_files: {
            select: {
              id: true,
              name: true,
              type: true,
              file_path: true,
              size: true,
              file_alt: true,
            }
          },
          task: {
            select: {
              id: true,
              role_name: true,
              ammount: true,
              post_count: true,
              status: true,
            }
          }
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
            appConfig().storageUrl.postFile + '/' + file.file_path,
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
      select: {
        id: true,
        content: true,
        schedule_at: true,
        hashtags: true,
        status: true,
        created_at: true,
        updated_at: true,
        feedback: true,
        task_id: true,
        post_channels: {
          select: {
            id: true,
            channel: {
              select: {
                id: true,
                name: true,
              }
            }
          }
        },
        post_files: {
          select: {
            id: true,
            name: true,
            type: true,
            file_path: true,
            size: true,
            file_alt: true,
          }
        },
      },
    });
    return { success: true, data: await this.findOne(id) };
  }

  async remove(id: string) {
    try {
      // First, get the post to check if it has any scheduled jobs
      const post = await this.prisma.post.findUnique({
        where: { id },
        include: {
          post_channels: true,
          post_files: true,
        },
      });

      if (!post) {
        return { success: false, message: 'Post not found' };
      }

      // Remove any scheduled jobs from the queue if the post was scheduled
      if (post.status === 1) {
        // Remove any pending jobs for this post
        const jobs = await this.postQueue.getJobs(['waiting', 'delayed']);
        for (const job of jobs) {
          if (job.data.postId === id) {
            await job.remove();
          }
        }
      }

      // Delete post files from storage
      for (const file of post.post_files) {
        try {
          await SojebStorage.delete('post/' + file.file_path);
        } catch (error) {
          console.warn(`Failed to delete file ${file.file_path}:`, error);
        }
      }

      // Delete all connected records in a transaction
      await this.prisma.$transaction(async (tx) => {
        // Delete post channels
        await tx.postChannel.deleteMany({
          where: { post_id: id },
        });

        // Delete post files
        await tx.postFile.deleteMany({
          where: { post_id: id },
        });

        // Finally delete the post
        await tx.post.delete({
          where: { id },
        });
      });

      return { success: true, message: 'Post and all connected records deleted successfully' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  async getScheduledPostsForCalendar(start: Date, end: Date, userId: string) {
    try {
      const posts = await this.prisma.post.findMany({
        where: {
          schedule_at: {
            gte: start,
            lte: end,
          },
          status: 1, // Only get scheduled posts
          deleted_at: null,
          task: { user_id: userId },
        },
        select: {
          id: true,
          content: true,
          schedule_at: true,
          hashtags: true,
          status: true,
          created_at: true,
          updated_at: true,
          post_channels: {
            select: {
              id: true,
              channel: {
                select: {
                  id: true,
                  name: true,
                }
              }
            }
          },
          post_files: {
            select: {
              id: true,
              name: true,
              type: true,
              file_path: true,
              size: true,
              file_alt: true,
            }
          },
        },
        orderBy: { schedule_at: 'asc' },
      });

      // Add public URLs to post files
      const postsWithUrls = posts.map((post) => ({
        ...post,
        post_files: post.post_files.map((file) => ({
          ...file,
          file_url: SojebStorage.url(
            appConfig().storageUrl.postFile + '/' + file.file_path,
          ),
        })),
      }));

      return { success: true, data: postsWithUrls };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  async getUpcomingPosts(userId: string) {
    try {
      const now = new Date();

      const posts = await this.prisma.post.findMany({
        where: {
          schedule_at: {
            gt: now,
          },
          status: 1,
          deleted_at: null,
          task: { user_id: userId },
        },
        select: {
          id: true,
          content: true,
          schedule_at: true,
          hashtags: true,
          status: true,
          created_at: true,
          updated_at: true,
          feedback: true,
          task_id: true,
          post_channels: {
            select: {
              id: true,
              channel: {
                select: {
                  id: true,
                  name: true,
                }
              }
            }
          },
          post_files: {
            select: {
              id: true,
              name: true,
              type: true,
              file_path: true,
              size: true,
              file_alt: true,
            }
          },
        },
        orderBy: { schedule_at: 'asc' },
      });

      // Add public URLs to post files
      const postsWithUrls = posts.map((post) => ({
        ...post,
        post_files: post.post_files.map((file) => ({
          ...file,
          file_url: SojebStorage.url(
            appConfig().storageUrl.postFile + '/' + file.file_path,
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
    status: 1 | 2, // 1 = approved, 2 = rejected
    feedback?: string,
  ) {
    try {
      // Step 1: Update post status
      const post = await this.prisma.post.update({
        where: { id: postId },
        data: {
          status: status,
          feedback: feedback || null,
          updated_at: new Date(),
        },
      });

      // Step 2: If post is approved, add to queue for publishing
      // if (status === 1) {
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
        // Step 4: Count approved posts for this task
        const approvedPostsCount = task.posts.filter((p) => p.status === 1).length;


        // Step 5: Check if the number of approved posts matches the assigned post count
        if (approvedPostsCount >= task.post_count) {
          // Update task status to Completed
          await this.prisma.taskAssign.update({
            where: { id: task.id },
            data: {
              status: 'completed',
              post_count: approvedPostsCount // Update the post count
            },
          });

          // Step 5.1: Update reseller's complete_tasks count and earnings
          const reseller = await this.prisma.reseller.findFirst({
            where: {
              TaskAssign: {
                some: { id: task.id }
              }
            }
          });

          if (reseller) {
            // Calculate task earnings (you may need to adjust this based on your business logic)
            const taskEarnings = task.order?.ammount ? task.order.ammount / task.order.order_assigns.length : 0;

            await this.prisma.reseller.update({
              where: { reseller_id: reseller.reseller_id },
              data: {
                complete_tasks: {
                  increment: 1
                },
                total_earnings: {
                  increment: taskEarnings
                }
              }
            });
          }
        } else {
          // Update the post count even if task is not complete yet
          await this.prisma.taskAssign.update({
            where: { id: task.id },
            data: {
              post_count: approvedPostsCount // Update the current post count
            },
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

  async getServerPublishedPosts(userId: string) {

    const user = await this.prisma.user.findFirst({
      where: {
        id: userId
      }
    })

    if (!user) {
      return { success: false, message: 'User not found' };
    }

    // 1. Find all published posts for the user
    const posts = await this.prisma.post.findMany({
      where: {
        status: 3, // published
        task: { user_id: userId },
      },
      select: {
        id: true,
        content: true,
        created_at: true,
        twitter_post_id: true,
        post_channels: {
          select: {
            channel: { select: { name: true } }
          }
        },
        post_performances: true,
      },
    });

    // 2. For each Twitter post, update its performance
    for (const post of posts) {
      const isTwitter = post.post_channels.some(
        pc => pc.channel.name.toLowerCase() === 'twitter'
      );
      if (isTwitter) {
        let perf = post.post_performances.find(p => p.provider === 'twitter');
        if (post.twitter_post_id) {
          const latest = await this.twitterService.fetchPostPerformance(post.twitter_post_id);
          if (perf) {
            await this.prisma.postPerformance.update({
              where: { id: perf.id },
              data: {
                likes: latest.likes,
                comments: latest.comments,
                shares: latest.shares,
                reach: latest.reach,
                impressions: latest.impressions,
              },
            });
          } else {
            await this.prisma.postPerformance.create({
              data: {
                post_id: post.id,
                provider: 'twitter',
                likes: latest.likes,
                comments: latest.comments,
                shares: latest.shares,
                reach: latest.reach,
                impressions: latest.impressions,
              },
            });
          }
        }
      }

      // For Facebook
      const isFacebook = post.post_channels.some(
        pc => pc.channel.name.toLowerCase() === 'facebook'
      );
      if (isFacebook) {
        // if (post.facebook_post_id) {
        //   const latest = await this.facebookService.fetchPostPerformance(post.facebook_post_id);
        //   // ...update or create PostPerformance
        // }
      }

      // For Instagram
      const isInstagram = post.post_channels.some(
        pc => pc.channel.name.toLowerCase() === 'instagram'
      );
      if (isInstagram) {
        // if (post.instagram_post_id) {
        //   const latest = await this.instagramService.fetchPostPerformance(post.instagram_post_id);
        //   // ...update or create PostPerformance
        // }
      }
    }

    // 3. Fetch again with select to return up-to-date data
    const updatedPosts = await this.prisma.post.findMany({
      where: {
        status: 3,
        task: { user_id: userId },
      },
      select: {
        id: true,
        content: true,
        created_at: true,
        post_channels: {
          select: {
            channel: { select: { name: true } }
          }
        },
        post_performances: true,
      },
    });

    return { success: true, data: updatedPosts };
  }

  async getPostStats(userId: string) {
    try {
      // 1. Fetch all published posts for the user
      const posts = await this.prisma.post.findMany({
        where: {
          status: 3, // published
          task: { user_id: userId },
        },
        select: {
          id: true,
          post_performances: {
            select: {
              likes: true,
              comments: true,
              shares: true,
              reach: true,
            },
          },
        },
      });

      const totalPosts = posts.length;
      let totalReach = 0;
      let totalEngagement = 0;
      let totalEngagementRate = 0;
      let postsWithReach = 0;

      for (const post of posts) {
        let postEngagement = 0;
        let postReach = 0;
        for (const perf of post.post_performances) {
          const likes = perf.likes || 0;
          const comments = perf.comments || 0;
          const shares = perf.shares || 0;
          const reach = perf.reach || 0;
          postEngagement += likes + comments + shares;
          postReach += reach;
        }
        totalEngagement += postEngagement;
        totalReach += postReach;
        if (postReach > 0) {
          totalEngagementRate += postEngagement / postReach;
          postsWithReach++;
        }
      }

      const avgEngagementRate = postsWithReach > 0 ? (totalEngagementRate / postsWithReach) : 0;
      const avgResponse = totalPosts > 0 ? (totalEngagement / totalPosts) : 0;

      return {
        success: true,
        data: {
          totalPosts,
          totalReach,
          engagementRate: Number(avgEngagementRate.toFixed(4)),
          avgResponse: Number(avgResponse.toFixed(2)),
        },
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to fetch Post stats.',
      };
    }
  }
}
