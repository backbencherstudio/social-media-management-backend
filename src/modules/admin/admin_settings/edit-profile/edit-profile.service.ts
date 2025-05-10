import { Injectable } from '@nestjs/common';
import { UpdateProfileDto } from './dto/update-edit-profile.dto';

@Injectable()
export class EditProfileService {

  findOne(id: number) {
    return `This action returns a #${id} editProfile`;
  }

  update(id: number, updateEditProfileDto: UpdateProfileDto) {
    return `This action updates a #${id} editProfile`;
  }

}
