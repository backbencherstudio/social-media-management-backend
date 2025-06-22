import { Injectable } from '@nestjs/common';
import { CreateDashboardDto } from './dto/create-dashboard.dto';
import { UpdateDashboardDto } from './dto/update-dashboard.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Status } from '@prisma/client';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) { }

  create(createDashboardDto: CreateDashboardDto) {
    return 'This action adds a new dashboard';
  }

  findAll() {
    return `This action returns all dashboard`;
  }

  findOne(id: number) {
    return `This action returns a #${id} dashboard`;
  }

  update(id: number, updateDashboardDto: UpdateDashboardDto) {
    return `This action updates a #${id} dashboard`;
  }

  remove(id: number) {
    return `This action removes a #${id} dashboard`;
  }

  async getDashboardStats(userId: string) {
    try {
      const reseller = await this.prisma.reseller.findFirst({
        where: { user_id: userId },
        include: { user: true },
      });

      if (!reseller) {
        return {
          success: false,
          message: 'Reseller not found.',
        };
      }

      const tasks = await this.prisma.taskAssign.findMany({
        where: {
          assignees: {
            some: {
              reseller_id: reseller.reseller_id,
            },
          },
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

      // TODO: Implement logic to calculate percentage changes and on-time delivery
      return {
        success: true,
        data: {
          welcomeMessage: `Welcome! ${reseller.user.name || 'Reseller'}`,
          taskSummary: `Let's Rock today. We have ${pendingTasks} Pending Tasks and ${newTasks} New Task.`,
          stats: {
            completedTasks: {
              count: completedTasks,
              change: 8.2, // Hardcoded
            },
            onTimeDelivery: {
              percentage: 96, // Hardcoded
              change: 0.8, // Hardcoded
            },
            earnings: {
              amount: reseller.total_earnings,
              change: 5.1, // Hardcoded
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
        include: {
          user: true,
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
        include: {
          user: true,
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

  async findAllActiveServices() {
    try {
      const services = await this.prisma.service.findMany({
        where: {
          status: 1, // active
        },
        include: {
          user: true,
          category: true,
        },
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
        include: {
          user: true,
          category: true,
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
