import { Controller, Get, Post, Body, Patch, Param, Delete, Req, UseGuards } from '@nestjs/common';
import { TaskManagementService } from './task_management.service';
import { AssignUserDto, UnassignUserDto } from './dto/create-task_management.dto';
import { Request } from 'express';
import { use } from 'passport';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from 'src/common/guard/role/role.enum';
import { Roles } from 'src/common/guard/role/roles.decorator';
import { RolesGuard } from 'src/common/guard/role/roles.guard';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';



@ApiBearerAuth()
@ApiTags('Website Info')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN_LITE)
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
    // const user_id = "cmb1qyzbb0002ree0itzp1f3g"; // req.user.id; // Assuming you have user ID from the request
    // if (!user_id) {
    //   return { message: 'User ID is required' };
    // }
    return this.taskManagementService.assignUserToOrder(  orderId, dto);
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
