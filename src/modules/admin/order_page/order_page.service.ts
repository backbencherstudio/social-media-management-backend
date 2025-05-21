import { Injectable } from '@nestjs/common';
import { CreateOrderPageDto , UpdateOrderDto } from './dto/create-order_page.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class OrderPageService {
  constructor(private readonly prisma: PrismaService,) {}
  create(createOrderPageDto: CreateOrderPageDto) {
    return 'This action adds a new orderPage';
  }

//--------------------------get all orders---------------------
async getAllOrders() {
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
//--------------------------get one order with details------------------------
async getOneOrder(orderId:string) {
  try {
    const orders = await this.prisma.order.findUnique({
      where:{
         id: orderId,
      },
      select: {
        id: true, 
        order_status: true, 
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
//-------------------update order progress-----------------------
async updateOrderType(orderId: string, updateOrderDto: UpdateOrderDto) {
    try {
      const updatedOrder = await this.prisma.order.update({
        where: { id: orderId },
        data: {
          order_status: updateOrderDto.order_type,
        },
      });

      return updatedOrder;
    } catch (error) {
      console.error('Error updating order type:', error);
      throw error;
    }
  }
}
