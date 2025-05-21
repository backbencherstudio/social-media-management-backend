import { Module } from '@nestjs/common';
import { TaskManagementService } from './task_management.service';
import { TaskManagementController } from './task_management.controller';

@Module({
  controllers: [TaskManagementController],
  providers: [TaskManagementService],
})
export class TaskManagementModule {}
