import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { TaskManagementService } from './task_management.service';
import { AssignUserDto, UnassignUserDto } from './dto/create-task_management.dto';


@Controller('task-management')
export class TaskManagementController {
  constructor(private readonly taskManagementService: TaskManagementService) {}

  @Get('all')
  async getAllTasks() {
    return await this.taskManagementService.getAllTasks();
  }

    // -----------------assign-order-to-the-resellers-----------------\\
@Post('/assign/:orderId')
async assignUser(
  @Param('orderId') orderId: string,
  @Body() dto: AssignUserDto
) {
  return this.taskManagementService.assignUserToOrder(orderId, dto);
}
  // -----------------assign-order-to-the-resellers-----------------\\
@Post('unassign/:orderId')
async unassignUser(
  @Param('orderId') orderId: string,
  @Body() dto: UnassignUserDto
) {
  return this.taskManagementService.unassignUserFromOrder(orderId, dto);
}

}
