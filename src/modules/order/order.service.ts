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
      const result = await this.prisma.$transaction(async (tx) => {
        const serviceTierIds = order_items.map(item => item.service_tier_id);
        const serviceTiers = await tx.serviceTier.findMany({
          where: { id: { in: serviceTierIds } },
          include: {
            service: {
              select: { name: true },
            },
          },
        });
        if (serviceTiers.length !== order_items.length) {
          throw new BadRequestException(`${serviceTiers.length} One or more service_tier_id values are invalid. ${order_items.length}`);
        }

        const totalAmount = serviceTiers.reduce((sum, tier) => {
          return sum + (tier.price ?? 0);
        }, 0);

        // Step 2: Create the order
        const order = await tx.order.create({
          data: {
             pakage_name: orderData.pakage_name,
            ammount: totalAmount,
            user_id: userDetails.id,
            user_name: userDetails.name,
            user_email: userDetails.email,
          } as Prisma.OrderUncheckedCreateInput,
        });

        // Step 3: Create Order_Details based on fetched tier + service info
        const orderDetailsData = serviceTiers.map((tier) => ({
          order_id: order.id,
          service_name: tier.service?.name ?? "Unknown Service",
          service_amount_name: tier.name ?? "Unknown Tier",
          service_count: tier.max_post ?? 0,
          service_price: tier.price ?? 0,
          service_tier_id: tier.id,
        }));

        await tx.order_Details.createMany({
          data: orderDetailsData,
        });

        return { order, orderDetails: orderDetailsData };
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
