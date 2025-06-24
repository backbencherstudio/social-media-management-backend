import { CreateOrderDetailDto } from "./create-order-details.dto";

export class CreateOrderDto {
  user_id: string;
  user_name: string;
  user_email: string;
  ammount: number;
  pakage_name: string;
  order_items: CreateOrderDetailDto[];
}