import { Controller, Get, Post, Body, Patch, Param, Delete, Put } from '@nestjs/common';
import { OrderPageService } from './order_page.service';
import { CreateOrderPageDto, UpdateOrderDto } from './dto/create-order_page.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Controller('order-page')
export class OrderPageController {
  constructor(
    private readonly orderPageService: OrderPageService,
   private readonly prisma: PrismaService,) {}

  // -----------------assign task to the reseller-------------------
  @Post()
  create(@Body() createOrderPageDto: CreateOrderPageDto) {
    return this.orderPageService.create(createOrderPageDto);
  }
// ----------------get all orders ----------------------
  @Get('all')
  findAll() {
    return this.orderPageService.getAllOrders();
  }

  // ----------------view order--------------------------
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.orderPageService.getOneOrder(id);
  }

  // ---------------update-order-type--------------------
  @Put(':id')
  async updateOrderType(
    @Param('id') orderId: string, 
    @Body() updateOrderDto: UpdateOrderDto
  ) {
    try {
      const updatedOrder = await this.orderPageService.updateOrderType(orderId, updateOrderDto);
      return { message: 'Order updated successfully', order: updatedOrder };
    } catch (error) {
      console.error('Error updating order:', error);
      throw error;
    }
  }


}
