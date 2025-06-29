import { Injectable } from '@nestjs/common';
import { CreateDashboardDto } from './dto/create-dashboard.dto';
import { UpdateDashboardDto } from './dto/update-dashboard.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Status } from '@prisma/client';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) { }

  async getDashboardStats(userId: string) {
    try {
      const user = await this.prisma.user.findFirst({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          type: true,
          created_at: true,
        },
      });

      if (!user) {
        return {
          success: false,
          message: 'User not found.',
        };
      }

      // Get tasks assigned to this user (if they are a client)
      const tasks = await this.prisma.taskAssign.findMany({
        where: {
          user_id: userId,
        },
        select: {
          status: true,
        },
      });

      const pendingTasks = tasks.filter(
        (t) => t.status === Status.pending,
      ).length;
      const newTasks = tasks.filter(
        (t) => t.status === Status.In_progress,
      ).length;
      const completedTasks = tasks.filter(
        (t) => t.status === Status.completed,
      ).length;

      // Get user's orders for earnings calculation
      const orders = await this.prisma.order.findMany({
        where: {
          user_id: userId,
        },
        select: {
          ammount: true,
          order_status: true,
        },
      });

      const totalEarnings = orders
        .filter(order => order.order_status === 'completed')
        .reduce((sum, order) => sum + (order.ammount || 0), 0);

      // TODO: Implement logic to calculate percentage changes and on-time delivery
      return {
        success: true,
        data: {
          welcomeMessage: `Welcome! ${user.name || 'User'}`,
          taskSummary: `You have ${pendingTasks} Pending Tasks and ${newTasks} New Tasks.`,
          stats: {
            completedTasks: {
              count: completedTasks,
              change: 8.2, // Hardcoded - TODO: Calculate actual change
            },
            onTimeDelivery: {
              percentage: 96, // Hardcoded - TODO: Calculate actual percentage
              change: 0.8, // Hardcoded - TODO: Calculate actual change
            },
            earnings: {
              amount: totalEarnings,
              change: 5.1, // Hardcoded - TODO: Calculate actual change
            },
          },
        },
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to fetch dashboard stats.',
      };
    }
  }

  async findAllClients(userId: string) {
    try {
      const reseller = await this.prisma.reseller.findFirst({
        where: {
          user_id: userId
        }
      })
      const tasks = await this.prisma.taskAssign.findMany({
        where: {
          reseller_id: reseller.reseller_id
        },
        select: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              type: true,
              created_at: true,
            },
          },
        },
      });

      // Deduplicate users by their id
      const userMap = new Map();
      for (const task of tasks) {
        if (task.user) {
          userMap.set(task.user.id, task.user);
        }
      }
      const clients = Array.from(userMap.values());

      return {
        success: true,
        data: clients,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to fetch clients.',
      };
    }
  }

  async findOneClient(resellerId: string, userId: string) {
    try {
      const task = await this.prisma.taskAssign.findFirst({
        where: {
          assignees: {
            some: {
              reseller_id: resellerId,
            },
          },
          user_id: userId,
        },
        select: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              type: true,
              created_at: true,
            },
          },
        },
      });

      if (!task || !task.user) {
        return {
          success: false,
          message: 'Client not found for this reseller.',
        };
      }

      return {
        success: true,
        data: task.user,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to fetch client.',
      };
    }
  }

  async findOneActiveService(id: string) {
    try {
      const service = await this.prisma.service.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          description: true,
          status: true,
          created_at: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          category: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      if (!service) {
        return { success: false, message: 'Service not found' };
      }

      return { success: true, data: service };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  async getUserActiveServices(userId: string) {
    try {
      const subscriptions = await this.prisma.subscription.findMany({
        where: {
          user_id: userId,
          status: 'active',
        },
        include: {
          service: {
            select: {
              id: true,
              name: true,
              description: true,
              category: { select: { id: true, name: true } },
            },
          },
          service_tier: {
            select: {
              id: true,
              name: true,
              price: true,
            },
          },
        },
      });
      return { success: true, data: subscriptions };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
}
