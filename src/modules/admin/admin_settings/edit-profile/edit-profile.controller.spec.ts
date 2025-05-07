import { Test, TestingModule } from '@nestjs/testing';
import { EditProfileController } from './edit-profile.controller';
import { EditProfileService } from './edit-profile.service';

describe('EditProfileController', () => {
  let controller: EditProfileController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EditProfileController],
      providers: [EditProfileService],
    }).compile();

    controller = module.get<EditProfileController>(EditProfileController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
