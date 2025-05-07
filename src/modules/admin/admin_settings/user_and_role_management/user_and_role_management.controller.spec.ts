import { Test, TestingModule } from '@nestjs/testing';
import { UserAndRoleManagementController } from './user_and_role_management.controller';
import { UserAndRoleManagementService } from './user_and_role_management.service';

describe('UserAndRoleManagementController', () => {
  let controller: UserAndRoleManagementController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserAndRoleManagementController],
      providers: [UserAndRoleManagementService],
    }).compile();

    controller = module.get<UserAndRoleManagementController>(UserAndRoleManagementController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
