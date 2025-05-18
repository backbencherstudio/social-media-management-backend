import { Injectable } from '@nestjs/common';
import { CreateOrderPageDto, UpdateOrderDto } from './dto/create-order_page.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class OrderPageService {
  constructor(private readonly prisma: PrismaService,) {}
  create(createOrderPageDto: CreateOrderPageDto) {
    return 'This action adds a new orderPage';
  }
async getAllOrders() {
  try {
    const orders = await this.prisma.order.findMany({
      select: {
        id: true, 
        order_type: true, 
        subscription_id: true, 
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

async getOneOrder(orderId:string) {
  try {
    const orders = await this.prisma.order.findUnique({
      where:{
         id: orderId,
      },
      select: {
        id: true, 
        order_type: true, 
        subscription_id: true, 
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

async updateOrderType(orderId: string, updateOrderDto: UpdateOrderDto) {
    try {
      const updatedOrder = await this.prisma.order.update({
        where: { id: orderId },
        data: {
          order_type: updateOrderDto.order_type,
        },
      });

      return updatedOrder;
    } catch (error) {
      console.error('Error updating order type:', error);
      throw error;
    }
  }

  remove(id: number) {
    return `This action removes a #${id} orderPage`;
  }
}
