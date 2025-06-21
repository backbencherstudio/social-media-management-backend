import { Injectable } from '@nestjs/common';
import { CreateResellerProfileDto } from './dto/create-reseller_profile.dto';
import { UpdateResellerProfileDto } from './dto/update-reseller_profile.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Status } from '@prisma/client';

@Injectable()
export class ResellerProfileService {
  constructor(private readonly prisma: PrismaService) {}
  create(createResellerProfileDto: CreateResellerProfileDto) {
    return 'This action adds a new resellerProfile';
  }
    //get One reseller task
  async getOneResellerTask(resellerId: string) {
    const tasks = await this.prisma.taskAssign.findMany({
      where: {
        assignees: {
          some: {
            reseller_id: resellerId,
          },
        },
      },
      orderBy: { created_at: 'desc' },
      include: {
        assignees: {
          select: {
            reseller_id: true,
            full_name: true,
            user_email: true,
          },
        },
        order: {
          select: {
            user_name: true,
            user_email: true,
          },
        },
      },
    });

    if (!tasks.length) {
      return { message: 'No tasks found for this reseller', tasks: [] };
    }


    const activeTasksCount = tasks.filter(task => task.status === Status.In_progress).length;

    const formattedTasks = tasks.map((task) => ({
      task_id: task.id,
      task_status: task.status,
      task_amount: task.ammount,
      Assign_Date: task.created_at,
      Assigned_by: task.assigned_by,
      due_date: task.due_date,
      note: task.note,
      YourInfo: task.assignees.map((a) => ({
        reseller_id: a.reseller_id,
        full_name: a.full_name,
        email: a.user_email,
      })),
      clint_name: task.order?.user_name,
      clint_email: task.order?.user_email,
    }));

    return {
      message: 'Reseller tasks fetched successfully',
      data: {
        total: formattedTasks.length,
        active_tasks: activeTasksCount,
        tasks: formattedTasks,
      },
    };
  }
  //tasks
  async getAllCompletedTasks(resellerId: string) {
  try {
    const tasks = await this.prisma.taskAssign.findMany({
      where: {
        status: 'completed',
        assignees: {
          some: {
            reseller_id: resellerId,
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
      include: {
        order: {
          select: {
            user_name: true,
            user_email: true,
          },

        },
      },
    });

    const totalEarnings = await this.prisma.reseller.findUnique({
      where: { reseller_id: resellerId },
      select: { total_earnings: true },
    });

    if (!tasks.length) {
      return { message: 'No completed tasks found', tasks: [] };
    }

    const formattedTasks = tasks.map(task => ({
      client_name: task.order?.user_name || 'N/A',
      client_email: task.order?.user_email || 'N/A',
      total_earnings: totalEarnings?.total_earnings || 0,
      post_type: task.post_type,
      status: task.status,
      date: task.created_at,
      totalEarnings: totalEarnings?.total_earnings || 0,
    }));

    return {
      message: 'Completed tasks fetched successfully',
      data: {
        total: formattedTasks.length,
        tasks: formattedTasks,
        
      },
    };
  } catch (error) {
    console.error('Error in getAllCompletedTasks:', error.message);
    throw new Error('Failed to fetch completed tasks');
  }
}


}
