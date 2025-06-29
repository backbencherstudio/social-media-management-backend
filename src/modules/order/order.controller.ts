import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, HttpException, HttpStatus } from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthService } from '../auth/auth.service';

@Controller('order')
export class OrderController {
  constructor(
    private readonly orderService: OrderService,
    private readonly authService: AuthService,
  ) { }

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Req() req: any, @Body() createOrderDto: CreateOrderDto ) {
    const user_id = createOrderDto.user_id || req.user.userId;
    const response = await this.authService.me(user_id);
    return this.orderService.createOrder(response.data, createOrderDto);
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  async getMyOrders(@Req() req: any) {
    const userId = req.user.userId;

    try {
      const orders = await this.orderService.findOrdersByUserId(userId);

      return {
        success: true,
        message: 'User orders fetched successfully',
        data: orders,
      };
    } catch (error) {
      console.error('Error fetching user orders:', error);

      throw new HttpException(
        {
          success: false,
          message: 'Failed to fetch user orders',
          error: error?.message || 'Unknown server error',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }


  @Get()
  findAll() {
    return this.orderService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.orderService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateOrderDto: UpdateOrderDto) {
    return this.orderService.update(+id, updateOrderDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.orderService.remove(+id);
  }
}
