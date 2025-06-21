import { Controller, Get, Post, Body, Patch, Param, Delete, Req } from '@nestjs/common';
import { TaskManagementService } from './task_management.service';
import { AssignUserDto, UnassignUserDto } from './dto/create-task_management.dto';
import { Request } from 'express';
import { use } from 'passport';


@Controller('task-management')
export class TaskManagementController {
  constructor(private readonly taskManagementService: TaskManagementService) { }

  @Get('all')
  async getAllTasks() {
    return await this.taskManagementService.getAllTasks();
  }

  // -----------------assign-order-to-the-resellers-----------------\\
  @Post('/assign/:orderId')
  async assignUser(
    @Req() req: Request,
    @Param('orderId') orderId: string,
    @Body() dto: AssignUserDto
  ) {
    const user_id = "cmb1qyzbb0002ree0itzp1f3g"; // req.user.id; // Assuming you have user ID from the request
    if (!user_id) {
      return { message: 'User ID is required' };
    }
    return this.taskManagementService.assignUserToOrder( user_id, orderId, dto);
  }
  // -----------------assign-order-to-the-resellers-----------------\\
  @Post('unassign/:orderId')
  async unassignUser(
    @Param('orderId') orderId: string,
    @Body() dto: UnassignUserDto
  ) {
    return this.taskManagementService.unassignUserFromOrder(orderId, dto);
  }

  @Get('reseller/:resellerId')
  async getResellerTasks(@Param('resellerId') resellerId: string) {
    const result = await this.taskManagementService.getOneResellerTask(resellerId);
    return result;
  }

}
