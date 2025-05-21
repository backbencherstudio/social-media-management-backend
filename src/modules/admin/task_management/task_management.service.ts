import { Injectable } from '@nestjs/common';
import { CreateTaskManagementDto, UnassignUserDto } from './dto/create-task_management.dto';
import { UpdateTaskManagementDto } from './dto/update-task_management.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { createId } from '@paralleldrive/cuid2';


@Injectable()
export class TaskManagementService {

    constructor(private readonly prisma: PrismaService,) {}

  create(createTaskManagementDto: CreateTaskManagementDto) {
    return 'This action adds a new taskManagement';
  }
 // ---------------------assign order to the reseller--------------------\\
async assignUserToOrder(
  orderId: string,
  dto: { userId: string; note: string; roleId: string }
) {
  const { userId, note, roleId } = dto;

  const user = await this.prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true },
  });

  if (!user) return ('User not found');

  const role = await this.prisma.role.findUnique({
    where: { id: roleId },
  });

  if (!role) return ('Role not found');

  const order = await this.prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!order) return ('Order not found');

    const existingTask = await this.prisma.taskAssign.findFirst({
    where: {
      order_id: orderId,
      user_id: userId,
      role_id: roleId,
    },
  });

  if (existingTask) {
    return {
      message: 'This user is already assigned to this order with the same role.',
    };
  }

  const task = await this.prisma.taskAssign.create({
    data: {
        id: `TASk_${createId()}`,
      user_id: user.id,
      user_name: user.name ?? '',
      order_id: order.id,
      role_id: role.id,
      role_name: role.name ?? '', 
      note: note,
      due_date: new Date().toISOString(),
      assignees: {
        connect: [{ id: user.id }],
      },
    },
    include: {
      assignees: true,
      role: true,
      order: true,
    },
  });

  return {
    message: 'User assigned with role successfully',
    task_details: {
    task_id:task.id,
    task_ammount:task.ammount,
       
    task_assignee_details:{
    assignee_id:task.user_id,
    assignee_name:task.user_name,
    task_status:task.status,
    role_id:task.role_id,
    role_name:task.role_name,

    },

    due_date:task.due_date,

    },
    order_details: {
    order_id: task.order_id,
    order_status:order.order_status,
    clint_name:order.user_name,
    clint_email:order.user_email,
    package_name:order.pakage_name,
    }
  };
}
// //---------------unassginging orders to the resellers-----------------\\
async unassignUserFromOrder(orderId: string, dto: UnassignUserDto) {
  const { taskId, userId, note } = dto;

  // Step 1: Check if the task exists and belongs to the correct order
  const task = await this.prisma.taskAssign.findUnique({
    where: { id: taskId },
    include: { assignees: true },
  });

  if (!task || task.order_id !== orderId) {
    throw new Error('Task not found or does not belong to this order');
  }

  // Step 2: Check if the user is assigned to the task
  const isAssigned = task.assignees.some((user) => user.id === userId);
  if (!isAssigned) {
    return { message: 'User is not assigned to this task' };
  }

  // Step 3: Disconnect the user from the task
  const updatedTask = await this.prisma.taskAssign.update({
    where: { id: taskId },
    data: {
      assignees: {
        disconnect: { id: userId },
      },
    },
    include: {
      assignees: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  // Step 4: If no assignees left, delete the task
  if (updatedTask.assignees.length === 0) {
    await this.prisma.taskAssign.delete({
      where: { id: taskId },
    });

    return {
      message: `User unassigned from task. Task deleted because there are no more assignees. Note: ${note}`,
      task_deleted: true,
    };
  }

  // Step 5: Return success message with updated task details
  return {
    message: `User unassigned from task. Note: ${note}`,
    task: updatedTask,
  };
}
}
