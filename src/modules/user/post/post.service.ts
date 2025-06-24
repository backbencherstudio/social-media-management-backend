import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';

@Injectable()
export class PostService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('post-schedule') private readonly postQueue: Queue,
  ) { }

  async findAll(userId: string) {
    const posts = await this.prisma.post.findMany({
      where: { task: { user_id: userId } },
      orderBy: { created_at: 'desc' },
    });
    return { success: true, data: posts };
  }

  // Get a single post for the user
  async findOne(userId: string, postId: string) {
    const post = await this.prisma.post.findFirst({
      where: { id: postId, task: { user_id: userId } },
    });
    if (!post) return { success: false, message: 'Post not found' };
    return { success: true, data: post };
  }

  // User reviews a post (approve/reject)
  async reviewPost(
    userId: string,
    postId: string,
    status: 1 | 2, // 1 = approved, 2 = rejected
    feedback?: string,
  ) {
    try {
      // Ensure the post belongs to the user
      const post = await this.prisma.post.findFirst({
        where: { id: postId, task: { user_id: userId } },
      });
      if (!post) return { success: false, message: 'Post not found or not allowed' };

      // Update post status and feedback
      const updatedPost = await this.prisma.post.update({
        where: { id: postId },
        data: {
          status,
          feedback: feedback || null,
          updated_at: new Date(),
        },
      });

      // Step 2: If post is approved, add to queue for publishing
      if (status === 1) {
        if (post.schedule_at) {
          const scheduleDate = new Date(post.schedule_at);
          const delay = scheduleDate.getTime() - Date.now();
          if (delay > 0) {
            console.log("call if blog")
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

      // Update the task's post count and status if needed
      const task = await this.prisma.taskAssign.findFirst({
        where: { id: post.task_id, user_id: userId },
        include: { posts: true },
      });

      if (task) {
        const approvedPostsCount = task.posts.filter((p) => p.status === 1).length;
        if (approvedPostsCount >= task.post_count) {
          // Mark task as completed
          await this.prisma.taskAssign.update({
            where: { id: task.id },
            data: {
              status: 'completed',
              post_count: approvedPostsCount,
            },
          });
        } else {
          // Just update the post count
          await this.prisma.taskAssign.update({
            where: { id: task.id },
            data: {
              post_count: approvedPostsCount,
            },
          });
        }
      }

      return {
        success: true,
        message: 'Post reviewed and related updates applied.',
        data: updatedPost,
      };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

}
