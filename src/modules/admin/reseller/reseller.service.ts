import { Injectable } from '@nestjs/common';
import { CreateResellerDto } from './dto/create-reseller.dto';
import { UpdateResellerDto } from './dto/update-reseller.dto';
import { UserRepository } from 'src/common/repository/user/user.repository';

@Injectable()
export class ResellerService {
  create(createResellerDto: CreateResellerDto) {
    return 'This action adds a new reseller';
  }

  findOne(id: number) {
    return `This action returns a #${id} reseller`;
  }

  update(id: number, updateResellerDto: UpdateResellerDto) {
    return `This action updates a #${id} reseller`;
  }

  remove(id: number) {
    return `This action removes a #${id} reseller`;
  }

   async findAllResellers(p0: { q: string; type: string; approved: string }) {
      try {
        const users = await UserRepository.getAllResellers();
        return {
          success: true,
          message: 'Resellers fetched successfully',
          data: users,
        };
      } catch (error) {
        return {
          success: false,
          message: error.message,
        };
      }
    }
  
}
