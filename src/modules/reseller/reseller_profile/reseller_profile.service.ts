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
 async getResellerEarningsAndTasks(resellerId: string) {
    // Fetch reseller data
    const reseller = await this.prisma.reseller.findUnique({
      where: { reseller_id: resellerId },
      select: {
        reseller_id: true,
        full_name: true,
        user_email: true,
        total_task: true,
        total_earnings: true,
        complete_tasks: true,
      },
    });

    if (!reseller) {
      return { message: 'Reseller not found' };
    }

    // Fetch completed tasks assigned to the reseller
    const completedTasks = await this.prisma.taskAssign.findMany({
      where: {
        assignees: {
          some: {
            reseller_id: resellerId,
          },
        },
        status: 'completed', // Filter by completed tasks
      },
      include: {
        order: true,
        assignees: {
          select: {
            reseller_id: true,
            full_name: true,
            user_email: true,
          },
        },
      },
    });

    // Format tasks for the response
    const formattedTasks = completedTasks.map((task) => ({
      task_id: task.id,
      task_status: task.status,
      task_amount: task.ammount,
      post_type: task.post_type,
      assign_date: task.created_at,
      client_name: task.order.user_name,
      client_email: task.order.user_email,
      order_status: task.order.order_status,
      package_name: task.order.pakage_name,
    }));

    return {
      message: 'Reseller earnings and completed tasks fetched successfully',
      data: {
        reseller: {
          full_name: reseller.full_name,
          email: reseller.user_email,
          total_earnings: reseller.total_earnings,
          total_tasks: reseller.total_task,
          complete_tasks: reseller.complete_tasks,
        },
        completed_tasks: formattedTasks,
      },
    };
  }
  //view details
  async getTaskDetails(taskId: string, resellerId: string) {
    const task = await this.prisma.taskAssign.findFirst({
      where: {
        id: taskId,
        assignees: {
          some: {
            reseller_id: resellerId,
          },
        },
      },
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

    if (!task) {
      return { message: 'Task not found or does not belong to this reseller' };
    }

    return {
      message: 'Task details fetched successfully',
      data: {
        task_id: task.id,
        task_status: task.status,
        task_amount: task.ammount,
        post_type: task.post_type,
        assign_date: task.created_at,
        client_name: task.order.user_name,
        client_email: task.order.user_email,
        task_note: task.note,
        // order_status: task.order.order_status,
        // package_name: task.order.pakage_name,
      },
    };
  }

async resellerPaymentWithdrawal(resellerId: string, amount: number, method: string) {
  try {
    // Fetch withdrawal settings
    const settings = await this.prisma.withdrawalSettings.findFirst();

    if (!settings) {
      return { message: 'Withdrawal settings not configured' };
    }

    const {
      minimum_withdrawal_amount,
      withdrawal_processing_fee,
      is_flat_commission,
      flat_commission_value,
      percentage_commission_value,
      payment_methods,
    } = settings;

    // Check if selected method is allowed
    if (!payment_methods.includes(method)) {
      return { message: `Invalid payment method. Allowed: ${payment_methods.join(', ')}` };
    }

    // Check if amount is above minimum
    if (amount < minimum_withdrawal_amount) {
      return { message: `Minimum withdrawal amount is ${minimum_withdrawal_amount}` };
    }

    // Fetch reseller's balance
    const reseller = await this.prisma.reseller.findUnique({
      where: { reseller_id: resellerId },
      select: { total_earnings: true },
    });

    if (!reseller) {
      return { message: 'Reseller not found' };
    }

    const totalEarnings = reseller.total_earnings;

    if (amount > totalEarnings) {
      return { message: 'Insufficient funds for withdrawal' };
    }

    // Calculate admin commission
    let adminCommission = 0;

    if (is_flat_commission && flat_commission_value) {
      adminCommission = flat_commission_value;
    } else if (!is_flat_commission && percentage_commission_value) {
      adminCommission = (amount * percentage_commission_value) / 100;
    }

    // Total deductions (admin + processing fee)
    const totalDeductions = adminCommission + (withdrawal_processing_fee || 0);

    const amountAfterDeductions = amount - totalDeductions;

    if (amountAfterDeductions <= 0) {
      return { message: 'Withdrawal amount is too low after deductions' };
    }

    // Save withdrawal request
    await this.prisma.resellerWithdrawal.create({
      data: {
        reseller_id: resellerId,
        amount: amountAfterDeductions,
        method: method,
        status: 1, // pending
      },
    });

    // Deduct from earnings
    await this.prisma.reseller.update({
      where: { reseller_id: resellerId },
      data: { total_earnings: totalEarnings - amount },
    });

    return {
      message: 'Withdrawal request created successfully',
      data: {
        requested_amount: amount,
        payment_method: method,
        admin_commission: adminCommission,
        processing_fee: withdrawal_processing_fee,
        final_amount: amountAfterDeductions,
        remaining_balance: totalEarnings - amount,
      },
    };
  } catch (error) {
    console.error('Error processing withdrawal:', error);
    throw new Error('Failed to process withdrawal');
  }
}

}
