import { Injectable } from '@nestjs/common';
import { CreateClintDto } from './dto/create-clint.dto';
import { UpdateClintDto } from './dto/update-clint.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ClintsService {
    constructor(private readonly prisma: PrismaService,) {}
  create(createClintDto: CreateClintDto) {
    return 'This action adds a new clint';
  }

  findAll() {
    return `This action returns all clints`;
  }

  findOne(id: number) {
    return `This action returns a #${id} clint`;
  }

  update(id: number, updateClintDto: UpdateClintDto) {
    return `This action updates a #${id} clint`;
  }

  remove(id: number) {
    return `This action removes a #${id} clint`;
  }


  async getAllClints() {
  try {
    const orders = await this.prisma.order.findMany({
      select: {
        id: true, 
        order_status: true, 
        subscription_id: true,
        ammount:true,
        pakage_name:true,
        user_email:true,
        user_name:true, 
        user_id: true, 
        subscription: {
          select: {
            service_id: true, 
            service_tier_id: true, 
          },
        },
      },
    });

    return orders;
  } catch (error) {
    console.error('Error retrieving orders:', error);
    throw error;
  }
}
}
