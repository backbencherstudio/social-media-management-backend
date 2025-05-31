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
  dto: { res_id: string; note: string; roleId: string ; ammount:number }
) {
  const { res_id, note, roleId,ammount } = dto;

  
  const reseller = await this.prisma.reseller.findUnique({
    where: { reseller_id: res_id },
    select: {
      reseller_id: true,
      full_name: true,
      status: true,
      user_id: true, 
    },
  });

  if (!reseller) {
    return { message: 'Reseller not found' };
  }

  if (reseller.status !== 'active') {
    return { message: 'Reseller is inactive' };
  }

  if (!reseller.user_id) {
    return { message: 'No user linked to this reseller' };
  }

  const user = await this.prisma.user.findUnique({
    where: { id: reseller.user_id },
    select: { id: true, name: true },
  });

  if (!user) {
    return { message: 'User not found for this reseller' };
  }

 
  const role = await this.prisma.role.findUnique({
    where: { id: roleId },
  });

  if (!role) {
    return { message: 'Role not found' };
  }


  const order = await this.prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!order) {
    return { message: 'Order not found' };
  }

  
  const existingTask = await this.prisma.taskAssign.findFirst({
    where: {
      order_id: orderId,
      reseller_id: reseller.reseller_id,
      role_id: roleId,
    },
  });

  if (existingTask) {
    return {
      message: 'This reseller is already assigned to this order with the same role.',
    };
  }

 
  const task = await this.prisma.taskAssign.create({
    data: {
      id: `TASK_${createId()}`,
      user_id: user.id,
      reseller_id: reseller.reseller_id,
      user_name: reseller.full_name ?? '',
      order_id: order.id,
      role_id: role.id,
      role_name: role.name ?? '',
      note: note,
      ammount:ammount,
      status: 'In_progress',
    },
    include: {
      assignees: true,
      user: true,
      role: true,
      order: true,
    },
  });

 
  await this.prisma.taskAssign.update({
    where: { id: task.id },
    data: {
      assignees: {
        connect: { reseller_id: reseller.reseller_id },
      },
    },
  });

  await this.prisma.reseller.update({
    where:{reseller_id:reseller.reseller_id},
    data:{
    total_task: { increment: 1 },
    }
  })

 
  return {
    message: 'Reseller assigned with role successfully',
    task_details: {
      task_id: task.id,
      task_amount: task.ammount ?? 0, 
      task_assignee_details: {
        assignee_id: task.id,
        assignee_name: task.user_name,
        task_status: task.status,
        role_id: task.role_id,
        role_name: task.role_name,
      },
      due_date: task.due_date,
    },
    order_details: {
      order_id: order.id,
      order_status: order.order_status,
      client_name: order.user_name,
      client_email: order.user_email,
      package_name: order.pakage_name,
    },
  };
}
// //---------------unassginging orders to the resellers-----------------\\
async unassignUserFromOrder(
  orderId: string,
  dto: { taskId: string; res_id: string; note: string }
) {
  const { taskId, res_id, note } = dto;

  const task = await this.prisma.taskAssign.findUnique({
    where: { id: taskId },
    include: { assignees: true, order: true },
  });

  if (!task || task.order_id !== orderId) {
    return { message: 'Task not found or does not belong to this order' };
  }


  const isAssigned = task.assignees.some((res_id) => res_id === res_id);
  if (!isAssigned) {
    return { message: 'User is not assigned to this task' };
  }

  
  const updatedTask = await this.prisma.taskAssign.update({
    where: { id: taskId },
    data: {
      assignees: {
        disconnect: { reseller_id: res_id },
      },
    },
    include: {
      assignees: {
        select: {reseller_id: true, full_name: true, user_email: true },
      },
    },
  });


  if (updatedTask.assignees.length === 0) {
    await this.prisma.taskAssign.delete({
      where: { id: taskId },
    });

    return {
      message: `User unassigned from task. Task deleted because there are no more assignees. Note: ${note}`,
      task_deleted: true,
    };
  }


  return {
    message: `User unassigned from task. Note: ${note}`,
    task: updatedTask,
  };
}


}
