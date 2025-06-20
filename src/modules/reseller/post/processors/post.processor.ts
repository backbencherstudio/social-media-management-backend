import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../../../../prisma/prisma.service';
import { TwitterService } from '../../../socials/platforms/twitter.service';

@Processor('post-schedule')
export class PostProcessor extends WorkerHost {
  private readonly logger = new Logger(PostProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly twitterService: TwitterService,
  ) {
    super();
  }

  @OnWorkerEvent('active')
  onActive(job: Job) {
    this.logger.log(`Processing job ${job.id} of type ${job.name}...`);
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job, result: any) {
    this.logger.log(`Job ${job.id} with name ${job.name} completed`);
  }

  async process(job: Job): Promise<any> {
    this.logger.log(`Processing job ${job.id} with name ${job.name}`);
    try {
      const { postId } = job.data;

      // Get the post with all related data
      const post = await this.prisma.post.findUnique({
        where: { id: postId },
        include: {
          post_channels: {
            include: {
              channel: true,
            },
          },
          post_files: true,
          task: {
            include: {
              user: true,
            },
          },
        },
      });

      if (!post) {
        throw new Error(`Post with ID ${postId} not found`);
      }

      // Update post status to indicate it's being processed
      await this.prisma.post.update({
        where: { id: postId },
        data: { status: 2 }, // 2 = processing
      });

      // Check if post is approved (status = 1)
      if (post.status !== 1) {
        this.logger.log(`Post ${postId} is not approved (status: ${post.status}), skipping publication`);
        return { success: false, message: 'Post is not approved for publication' };
      }

      // Get the user ID from the task
      if (!post.task || !post.task.user_id) {
        throw new Error('Post is not associated with a user task');
      }

      const userId = post.task.user_id;
      this.logger.log(`Publishing post for user: ${userId}`);

      // Process each channel
      const publishResults = [];

      for (const postChannel of post.post_channels) {
        const channelName = postChannel.channel.name?.toLowerCase();

        if (channelName === 'twitter') {
          try {
            // Prepare post data for Twitter
            const postData = {
              content: post.content || '',
              hashtags: post.hashtags || [],
              mediaFiles: post.post_files.map(file => ({
                name: file.name || '',
                type: file.type || '',
                file_path: file.file_path || '',
              })),
            };

            // Publish to Twitter
            const twitterResult = await this.twitterService.publishPost(userId, postData);

            publishResults.push({
              channel: 'twitter',
              success: twitterResult.success,
              message: twitterResult.message,
              // data: twitterResult.detais
            });

            this.logger.log(`Twitter publish result:`, twitterResult);
          } catch (error) {
            this.logger.error(`Error publishing to Twitter:`, error);
            publishResults.push({
              channel: 'twitter',
              success: false,
              message: `Twitter publish failed: ${error.message}`,
            });
          }
        } else {
          // For other channels, log that they're not implemented yet
          this.logger.log(`Channel ${channelName} is not implemented for automatic publishing`);
          publishResults.push({
            channel: channelName,
            success: false,
            message: `Channel ${channelName} not implemented for automatic publishing`,
          });
        }
      }

      // Check if any channel was successfully published
      const hasSuccessfulPublish = publishResults.some(result => result.success);

      if (hasSuccessfulPublish) {
        // Update post status to published
        await this.prisma.post.update({
          where: { id: postId },
          data: { status: 3 }, // 3 = published
        });

        this.logger.log(`Post ${postId} published successfully to at least one channel`);
      } else {
        // Update post status to failed
        await this.prisma.post.update({
          where: { id: postId },
          data: { status: 4 }, // 4 = failed
        });

        this.logger.error(`Post ${postId} failed to publish to any channel`);
      }

      return {
        success: hasSuccessfulPublish,
        message: hasSuccessfulPublish ? 'Post published successfully' : 'Post failed to publish',
        results: publishResults,
      };
    } catch (error) {
      this.logger.error(
        `Error processing job ${job.id} with name ${job.name}`,
        error,
      );

      // Update post status to failed
      try {
        await this.prisma.post.update({
          where: { id: job.data.postId },
          data: { status: 4 }, // 4 = failed
        });
      } catch (updateError) {
        this.logger.error('Failed to update post status to failed:', updateError);
      }

      throw error;
    }
  }
} 