import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { Prisma } from '@prisma/client';
import { UpdateOrderDto } from './dto/update-order.dto';

@Injectable()
export class OrderService {
  constructor(private readonly prisma: PrismaService) { }

  async createOrder(dto: CreateOrderDto) {
    const { order_items, ...orderData } = dto;
    try {
      const result = await this.prisma.$transaction(async (tx) => {
        // Step 1: Create the order
        const order = await tx.order.create({
          data: {
            ...orderData,
          } as Prisma.OrderUncheckedCreateInput, // 👈 Fix type mismatch
        });

        // Step 2: Create all related order details
        const orderDetails = await tx.order_Details.createMany({
          data: order_items.map((item) => ({
            order_id: order.id, 
            service_name: item.service_name,
            service_amount: item.service_amount,
            service_price: item.service_price,
            service_tier_id: item.service_tier_id,
          })),
        });

        return { order, orderDetails };
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
