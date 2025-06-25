import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class PostService {
  constructor(
    private readonly prisma: PrismaService,
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
      include: {
        post_files: true,
        task: true,
      },
    });
    return { success: true, data: post };
  }

  // User reviews a post (approve/reject)
  // async reviewPost(
  //   userId: string,
  //   postId: string,
  //   status: 1 | 2, // 1 = approved, 2 = rejected
  //   feedback?: string,
  // ) {
  //   try {
  //     // Ensure the post belongs to the user
  //     const post = await this.prisma.post.findFirst({
  //       where: { id: postId, task: { user_id: userId } },
  //     });
  //     if (!post) return { success: false, message: 'Post not found or not allowed' };

  //     // Update post status and feedback
  //     const updatedPost = await this.prisma.post.update({
  //       where: { id: postId },
  //       data: {
  //         status,
  //         feedback: feedback || null,
  //       },
  //     });

  //     // Update the task's post count and status if needed
  //     const task = await this.prisma.taskAssign.findFirst({
  //       where: { id: post.task_id, user_id: userId },
  //       include: {
  //         posts: true,
  //         order: {
  //           include: { order_assigns: true }
  //         }
  //       },
  //     });

  //     if (task) {
  //       const approvedPostsCount = task.posts.filter((p) => p.status === 1).length;
  //       if (approvedPostsCount >= task.post_count) {
  //         // Mark task as completed
  //         await this.prisma.taskAssign.update({
  //           where: { id: task.id },
  //           data: {
  //             status: 'completed',
  //             post_count: approvedPostsCount,
  //           },
  //         });
  //         // Step 5.1: Update reseller's complete_tasks count and earnings
  //         const reseller = await this.prisma.reseller.findFirst({
  //           where: {
  //             TaskAssign: {
  //               some: { id: task.id }
  //             }
  //           }
  //         });

  //         if (reseller) {
  //           // Calculate task earnings (you may need to adjust this based on your business logic)
  //           const taskEarnings = task.order?.ammount ? task.order.ammount / task.order.order_assigns.length : 0;

  //           await this.prisma.reseller.update({
  //             where: { reseller_id: reseller.reseller_id },
  //             data: {
  //               complete_tasks: {
  //                 increment: 1
  //               },
  //               total_earnings: {
  //                 increment: taskEarnings
  //               }
  //             }
  //           });
  //         }
  //       } else {
  //         // Just update the post count
  //         await this.prisma.taskAssign.update({
  //           where: { id: task.id },
  //           data: {
  //             post_count: approvedPostsCount,
  //           },
  //         });
  //       }
  //     }

  //     return {
  //       success: true,
  //       message: 'Post reviewed and related updates applied.',
  //       data: updatedPost,
  //     };
  //   } catch (error) {
  //     return { success: false, message: error.message };
  //   }
  // }

}
