import { Module } from '@nestjs/common';
import { UserAndRoleManagementService } from './user_and_role_management.service';
import { UserAndRoleManagementController } from './user_and_role_management.controller';

@Module({
  controllers: [UserAndRoleManagementController],
  providers: [UserAndRoleManagementService],
})
export class UserAndRoleManagementModule {}
