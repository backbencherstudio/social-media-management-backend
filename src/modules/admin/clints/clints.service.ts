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
    
    const userStats = await this.prisma.order.groupBy({
      by: ['user_id'],
      _count: { user_id: true },
      _sum: { ammount: true },
    });

    const statsMap = new Map(
      userStats.map(stat => [
        stat.user_id,
        {
          total_orders: stat._count.user_id,
          total_spent: stat._sum.ammount || 0,
        },
      ])
    );


    const allOrders = await this.prisma.order.findMany({
      orderBy: { created_at: 'desc' }, 
      select: {
        id: true,
        order_status: true,
        subscription_id: true,
        ammount: true,
        pakage_name: true,
        user_email: true,
        user_name: true,
        user_id: true,
        subscription: {
          select: {
            service_id: true,
            service_tier_id: true,
          },
        },
      },
    });


    const seenUserIds = new Set();
    const latestOrdersPerUser = [];

    for (const order of allOrders) {
      if (!seenUserIds.has(order.user_id)) {
        seenUserIds.add(order.user_id);

        const stats = statsMap.get(order.user_id) || {
          total_orders: 0,
          total_spent: 0,
        };

        latestOrdersPerUser.push({
          ...order,
          total_orders: stats.total_orders,
          total_spent: stats.total_spent,
        });
      }
    }

    return { data: latestOrdersPerUser };
  } catch (error) {
    console.error('Error retrieving latest orders:', error);
    throw error;
  }
}





}
