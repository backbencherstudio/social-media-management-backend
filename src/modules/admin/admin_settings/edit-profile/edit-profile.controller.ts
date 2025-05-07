import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
} from '@nestjs/common';
import { EditProfileService } from './edit-profile.service';
import { UpdateProfileDto } from './dto/update-edit-profile.dto';

@Controller('edit-profile')
export class EditProfileController {
  constructor(private readonly editProfileService: EditProfileService) {}

  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      const profile = await this.editProfileService.findOne(+id);
      return {
        success: true,
        message: 'Profile fetched successfully',
        data: profile,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to fetch profile',
      };
    }
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateEditProfileDto: UpdateProfileDto,
  ) {
    try {
      const updatedProfile = await this.editProfileService.update(+id, updateEditProfileDto);
      return {
        success: true,
        message: 'Profile updated successfully',
        data: updatedProfile,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to update profile',
      };
    }
  }
}
