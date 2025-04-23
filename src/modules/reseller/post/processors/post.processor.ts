import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../../../../prisma/prisma.service';

@Processor('post-schedule')
export class PostProcessor extends WorkerHost {
  private readonly logger = new Logger(PostProcessor.name);

  constructor(private readonly prisma: PrismaService) {
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

      // Update post status to indicate it's being processed
      await this.prisma.post.update({
        where: { id: postId },
        data: { status: 2 }, // 2 = processing
      });

      // TODO: Implement actual post publishing logic here
      // This would involve:
      // 1. Getting post channels
      // 2. Publishing to each channel
      // 3. Updating post status to published

      // Update post status to published
      await this.prisma.post.update({
        where: { id: postId },
        data: { status: 3 }, // 3 = published
      });

      return { success: true };
    } catch (error) {
      this.logger.error(
        `Error processing job ${job.id} with name ${job.name}`,
        error,
      );
      throw error;
    }
  }
} 