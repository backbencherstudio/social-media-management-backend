import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { NotificationRepository } from 'src/common/repository/notification/notification.repository';
import { MessageGateway } from 'src/modules/chat/message/message.gateway';
import { CreateClientQuestionnaireDto } from './dto/create-client-questionnaire.dto';
import { UpdateClientQuestionnaireDto } from './dto/update-client-questionnaire.dto';

@Injectable()
export class PostService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly messageGateway: MessageGateway,
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


  async reviewPost(
    userId: string,
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

      // Step 2: Get related task via post.task_id
      const task = await this.prisma.taskAssign.findFirst({
        where: {
          posts: { some: { id: postId } },
        },
        include: {
          posts: true,
          order: {
            include: { order_assigns: true },
          },
        },
      });
      if (task) {
        // Step 3: Count approved posts for this task
        const approvedPostsCount = task.posts.filter((p) => p.status === 1).length;
        // Step 4: Check if the number of approved posts matches the assigned post count
        if (approvedPostsCount >= task.post_count) {
          // Update task status to Completed
          await this.prisma.taskAssign.update({
            where: { id: task.id },
            data: {
              status: 'completed',
              post_count: approvedPostsCount
            },
          });
          // Step 4.1: Update reseller's complete_tasks count and earnings
          const reseller = await this.prisma.reseller.findFirst({
            where: {
              TaskAssign: {
                some: { id: task.id }
              }
            }
          });
          if (reseller) {
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
              post_count: approvedPostsCount
            },
          });
        }
        // Step 5: Notify reseller
        const reseller = await this.prisma.reseller.findFirst({
          where: {
            TaskAssign: {
              some: { id: task.id }
            }
          },
        });
        if (reseller) {
          const notificationPayload = {
            sender_id: userId,
            receiver_id: reseller.user_id,
            text: status === 1 ? 'Your post has been approved by the user.' : 'Your post has been rejected by the user.',
            type: 'post' as const,
            entity_id: post.id,
          };
          await NotificationRepository.createNotification(notificationPayload);
          this.messageGateway.server.emit('notification', notificationPayload);
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
