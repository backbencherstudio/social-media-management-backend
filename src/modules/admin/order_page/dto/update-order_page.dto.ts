import { PartialType } from '@nestjs/swagger';
import { CreateOrderPageDto } from './create-order_page.dto';

export class UpdateOrderPageDto extends PartialType(CreateOrderPageDto) {}
