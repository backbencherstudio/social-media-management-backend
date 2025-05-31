import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { CreateOrderPageDto , UpdateOrderDto } from './dto/create-order_page.dto';
import { PrismaService } from 'src/prisma/prisma.service';



@Injectable()
export class OrderPageService {
  constructor(private readonly prisma: PrismaService,) {}
  create(createOrderPageDto: CreateOrderPageDto) {
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
        payment_status:true,
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
        payment_status:true,
        ammount:true,
        pakage_name:true,
        user_id: true, 
        user_email:true,
        user_name: true,
        subscription: {
          select: {
            service_id: true, 
            service_tier_id: true, 
            start_at:true,
            end_at:true
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
// ---------------------total purchased -----------------------------
async getTotalPurchasedAmount(){
  try {
    const orders = await this.prisma.order.findMany({
      select: { ammount: true }, 
    });

    const sum = orders.reduce((total, order) => total + order.ammount, 0);
    return {
      message: 'success',
       data:{
         service_purchased:sum,
       }
    };


  } catch (error) {
    console.error('Error calculating total amount:', error);
    throw new InternalServerErrorException('Failed to calculate total amount');
  }
}
// ---------------------order details----------------------------------
// async getOrderDetails(orderId: string) {
//   return this.prisma.order.findUnique({
//     where: { id: orderId },
//     include: {
//       user: true,           
//       service_tier: true,   
//     },
//   });
// }
}
