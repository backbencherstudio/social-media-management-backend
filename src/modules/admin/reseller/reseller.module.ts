import { Module } from '@nestjs/common';
import { ResellerService } from './reseller.service';
import { ResellerController } from './reseller.controller';
import { TaskManagementModule } from '../task_management/task_management.module';

@Module({
  imports: [TaskManagementModule],
  controllers: [ResellerController],
  providers: [ResellerService],
})
export class ResellerModule {}
