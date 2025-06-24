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

  async findAllClients(resellerId: string) {
    try {
      const tasks = await this.prisma.taskAssign.findMany({
        where: {
          assignees: {
            some: {
              reseller_id: resellerId,
            },
          },
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
      const clients = tasks
        .map((task) => task.user)
        // todo this .filter((user) => user !== null && user.type === 'clint');
        .filter((user) => user !== null);

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

  async findAllActiveServices(clientId?: string) {
    try {
      const services = await this.prisma.service.findMany({
        where: {
          status: 1,
          // service_tiers: {
          //   some: {
          //     orders: clientId ? {
          //       some: {
          //         user_id: clientId
          //       }
          //     } : undefined
          //   }
          // }
        },
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
          service_tiers: {
            select: {
              id: true,
              name: true,
              price: true,
              orders: {
                select: {
                  id: true,
                  status: true,
                },
              },
            },
          },
        },
        take: 3,
      });
      return { success: true, data: services };
    } catch (error) {
      return { success: false, message: error.message };
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
}
