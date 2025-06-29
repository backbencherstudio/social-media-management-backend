import { Injectable, HttpException, HttpStatus, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { Prisma } from '@prisma/client';
import { UpdateOrderDto } from './dto/update-order.dto';

@Injectable()
export class OrderService {
  constructor(private readonly prisma: PrismaService) { }
async createOrder(userDetails, dto: CreateOrderDto) {
  const { order_items, ...orderData } = dto;
  try {
    
    if (!userDetails?.id) {
      throw new Error('User ID is required and cannot be undefined');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const serviceTierIds = order_items.map(item => item.service_tier_id);
      const serviceTiers = await tx.serviceTier.findMany({
        where: { id: { in: serviceTierIds } },
        include: {
          service: { select: { name: true } },
        },
      });

      if (serviceTiers.length !== order_items.length) {
        throw new BadRequestException(
          `Invalid service tier IDs provided. Expected ${order_items.length}, but found ${serviceTiers.length}.`
        );
      }

      const totalAmount = serviceTiers.reduce((sum, tier) => sum + (tier.price ?? 0), 0);

      
      const order = await tx.order.create({
        data: {
          pakage_name: orderData.pakage_name,
          ammount: totalAmount,
          user_id: userDetails.id, 
          user_name: userDetails.name,
          user_email: userDetails.email,
        } as Prisma.OrderUncheckedCreateInput,
      });

     
      const orderDetailsData = serviceTiers.map((tier) => ({
        order_id: order.id,
        service_name: tier.service?.name ?? 'Unknown Service',
        service_id: tier.service_id ?? '', // Ensure service_id is provided
        service_amount_name: tier.name ?? 'Unknown Tier',
        service_count: tier.max_post ?? 0,
        service_price: tier.price ?? 0,
        service_tier_id: tier.id,
      }));

      await tx.order_Details.createMany({
        data: orderDetailsData,
      });

     
      const now = new Date();
      const end = new Date(now);
      end.setMonth(end.getMonth() + 1); 

      const user = await tx.user.findUnique({
        where: { id: userDetails.id }, 
      });

      if (!user) {
        throw new Error('User not found');
      }

      const subscription = await tx.subscription.create({
        data: {
          user: { connect: { id: user.id } },
          order: { connect: { id: order.id } }, 
          start_at: now,
          end_at: end,
          status: 'active',
        },
      });

      const updatedOrder = await tx.order.update({
        where: { id: order.id },
        data: { subscription_id: subscription.id },
      });


      return { order: updatedOrder, orderDetails: orderDetailsData, subscription };
    });

    return {
      statusCode: HttpStatus.CREATED,
      message: 'Order and its details created successfully',
      data: result,
    };
  } catch (error) {
    console.error('Transaction failed:', error);

    throw new HttpException(
      {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Order creation failed',
        error: error?.message || 'Transaction error',
      },
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}




  async findOrdersByUserId(userId: string) {
    return this.prisma.order.findMany({
      where: { user_id: userId },
      include: {
        Order_Details: true,
      },
      orderBy: {
        created_at: 'desc',
      },
    });
  }


  create(createOrderDto: CreateOrderDto) {
    return 'This action adds a new order';
  }

  findAll() {
    return `This action returns all order`;
  }

  findOne(id: number) {
    return `This action returns a #${id} order`;
  }

  update(id: number, updateOrderDto: UpdateOrderDto) {
    return `This action updates a #${id} order`;
  }

  remove(id: number) {
    return `This action removes a #${id} order`;
  }
}
