import { Controller, Get, Post, Body, Patch, Param, Delete, Req } from '@nestjs/common';
import { TaskManagementService } from './task_management.service';
import { AssignUserDto, UnassignUserDto } from './dto/create-task_management.dto';
import { Request } from 'express';


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
    // const user_id = req.user.userId;
    return this.taskManagementService.assignUserToOrder( orderId, dto);
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
