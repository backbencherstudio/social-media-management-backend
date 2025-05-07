import { Test, TestingModule } from '@nestjs/testing';
import { UserAndRoleManagementService } from './user_and_role_management.service';

describe('UserAndRoleManagementService', () => {
  let service: UserAndRoleManagementService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserAndRoleManagementService],
    }).compile();

    service = module.get<UserAndRoleManagementService>(UserAndRoleManagementService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
