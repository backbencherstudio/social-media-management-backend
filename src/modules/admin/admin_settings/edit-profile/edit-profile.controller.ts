import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { EditProfileService } from './edit-profile.service';
import { UpdateProfileDto } from './dto/update-edit-profile.dto';
import { ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { use } from 'passport';
import { RolesGuard } from 'src/common/guard/role/roles.guard';
import { Role } from 'src/common/guard/role/role.enum';
import { Roles } from 'src/common/guard/role/roles.decorator';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN_LITE)
@Controller('edit-profile')
export class EditProfileController {
  constructor(private readonly editProfileService: EditProfileService) { }


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
