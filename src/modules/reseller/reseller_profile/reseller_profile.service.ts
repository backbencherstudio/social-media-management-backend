import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateResellerProfileDto } from './dto/create-reseller_profile.dto';
import { UpdateResellerProfileDto } from './dto/update-reseller_profile.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Status } from '@prisma/client';
import { WithdrawPaymentDto } from './dto/withdraw-payment-dto';
import { StripePayment } from 'src/common/lib/Payment/stripe/StripePayment';
import Stripe from 'stripe';

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

  //This function handles the withdrawal request for a reseller
async resellerPaymentWithdrawal(
  resellerId: string,
  account_id: string,
  withdrawPaymentDto: WithdrawPaymentDto
) {
  try {
    const settings = await this.prisma.withdrawalSettings.findFirst();

    const reseller = await this.prisma.reseller.findUnique({
      where: { reseller_id: resellerId },
      select: { user_id: true },
    });

    if (!reseller) throw new NotFoundException('Reseller not found');

    const user = await this.prisma.user.findUnique({
      where: { id: reseller.user_id },
    });

    if (!user) throw new NotFoundException('User not found');
    if (!user.banking_id) throw new NotFoundException('User has no Stripe account connected');

    if (!settings) return { message: 'Withdrawal settings not configured' };

    const {
      minimum_withdrawal_amount,
      withdrawal_processing_fee,
      is_flat_commission,
      flat_commission_value,
      percentage_commission_value,
      payment_methods,
    } = settings;

    if (!payment_methods.includes(withdrawPaymentDto.method)) {
      return {
        message: `Invalid payment method. Allowed: ${payment_methods.join(', ')}`,
      };
    }

    if (withdrawPaymentDto.amount < minimum_withdrawal_amount) {
      return {
        message: `Minimum withdrawal amount is ${minimum_withdrawal_amount}`,
      };
    }

    const totalEarnings = await this.prisma.reseller.findUnique({
      where: { reseller_id: resellerId },
      select: { total_earnings: true },
    });

    if (!totalEarnings || withdrawPaymentDto.amount > totalEarnings.total_earnings) {
      return { message: 'Insufficient funds for withdrawal' };
    }

    // Calculate fees
    let adminCommission = 0;
    if (is_flat_commission && flat_commission_value) {
      adminCommission = flat_commission_value;
    } else if (!is_flat_commission && percentage_commission_value) {
      adminCommission = (withdrawPaymentDto.amount * percentage_commission_value) / 100;
    }

    const totalDeductions = adminCommission + (withdrawal_processing_fee || 0);
    const amountAfterDeductions = withdrawPaymentDto.amount - totalDeductions;

    if (amountAfterDeductions <= 0) {
      return { message: 'Withdrawal amount is too low after deductions' };
    }

    // Check admin balance
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
      apiVersion: '2025-05-28.basil',
    });

    const balance = await stripe.balance.retrieve();
    const adminAvailable = balance.available.find((b) => b.currency === 'usd')?.amount || 0;
    console.log(adminAvailable, "adminAvailable");
    

    if (adminAvailable < Math.round(amountAfterDeductions * 100)) {
      throw new Error('Admin Stripe balance is too low to fund the withdrawal.');
    }

    const metadata = {
      user_id: user.id,
      account_id: user.banking_id,
      method: withdrawPaymentDto.method,
    };

    // 1. Transfer from Admin → Reseller Stripe
    const transfer = await stripe.transfers.create({
      amount: Math.round(amountAfterDeductions * 100),
      currency: 'usd',
      destination: user.banking_id,
      metadata,
    });

    //2. Payout from Reseller Stripe → Bank
    const payout = await stripe.payouts.create(
      {
        amount: Math.round(amountAfterDeductions * 100),
        currency: 'usd',
        metadata,
      },
      {
        stripeAccount: user.banking_id,
      }
    );

    // Record DB entries
    const resellerWithdrawal = await this.prisma.resellerWithdrawal.create({
      data: {
        reseller_id: resellerId,
        amount: amountAfterDeductions,
        method: withdrawPaymentDto.method,
        status: 1,
      },
    });

    await this.prisma.paymentTransaction.create({
      data: {
        user_id: user.id,
        amount: withdrawPaymentDto.amount,
        currency: 'usd',
        status: 'PENDING',
        type: 'WITHDRAWAL',
      },
    });

    await this.prisma.reseller.update({
      where: { reseller_id: resellerId },
      data: {
        total_earnings:
          totalEarnings.total_earnings - withdrawPaymentDto.amount,
      },
    });

    return {
      message: 'Withdrawal request created successfully',
      data: {
        id: resellerWithdrawal.id,
        requested_amount: withdrawPaymentDto.amount,
        payment_method: withdrawPaymentDto.method,
        admin_commission: adminCommission,
        processing_fee: withdrawal_processing_fee,
        final_amount: amountAfterDeductions,
        remaining_balance:
          totalEarnings.total_earnings - withdrawPaymentDto.amount,
        stripe_transfer_id: transfer.id,
        stripe_payout_id: payout.id,
      },
    };
  } catch (error) {
    console.error('Error processing withdrawal:', error);
    throw new Error('Failed to process withdrawal. Please try again later.');
  }
}

}
