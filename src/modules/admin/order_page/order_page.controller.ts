import { Controller, Get, Post, Body, Patch, Param, Delete, Put, UseGuards } from '@nestjs/common';
import { OrderPageService } from './order_page.service';
import { CreateOrderPageDto, UpdateOrderDto } from './dto/create-order_page.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from 'src/common/guard/role/role.enum';
import { Roles } from 'src/common/guard/role/roles.decorator';
import { RolesGuard } from 'src/common/guard/role/roles.guard';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';


@ApiBearerAuth()
@ApiTags('Website Info')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN_LITE)
@Controller('order-page')
export class OrderPageController {
  constructor(
    private readonly orderPageService: OrderPageService,
    private readonly prisma: PrismaService,
  ) {}

  // -----------------assign task to the reseller-------------------
  @Post()
  async create(@Body() createOrderPageDto: CreateOrderPageDto) {
    try {
      return await this.orderPageService.create(createOrderPageDto);
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  }
  // ----------------get all orders ----------------------
  @Get('all')
  async findAll() {
    try {
      return await this.orderPageService.getAllOrders();
    } catch (error) {
      console.error('Error fetching all orders:', error);
      throw error;
    }
  }
  // ---------------total ammount---------------------
  @Get('total')
  async getTotalAmount() {
    try {
      const result = await this.orderPageService.getTotalPurchasedAmount();
      return result;
    } catch (error) {
      console.error('Error calculating total amount:', error);
      throw error;
    }
  }
  // ----------------view order--------------------------
  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      return await this.orderPageService.getOneOrder(id);
    } catch (error) {
      console.error(`Error fetching order with ID ${id}:`, error);
      throw error;
    }
  }
  // ---------------update-order-type--------------------
  @Put(':id')
  async updateOrderType(
    @Param('id') orderId: string,
    @Body() updateOrderDto: UpdateOrderDto,
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
