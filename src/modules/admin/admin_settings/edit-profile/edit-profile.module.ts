import { Module } from '@nestjs/common';
import { EditProfileService } from './edit-profile.service';
import { EditProfileController } from './edit-profile.controller';

@Module({
  controllers: [EditProfileController],
  providers: [EditProfileService],
})
export class EditProfileModule {}
