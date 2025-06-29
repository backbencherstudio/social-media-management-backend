import { Controller, Post, Req, Headers, Body, UseGuards, HttpException, HttpStatus } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { Request } from 'express';
import { TransactionRepository } from '../../../common/repository/transaction/transaction.repository';
import { CreatePaymentIntentDto } from './dto/create-stripe.dto';
import { StripePayment } from 'src/common/lib/Payment/stripe/StripePayment';
import { PrismaService } from '../../../prisma/prisma.service';
import { createId } from '@paralleldrive/cuid2';
import { CreateOrderDto } from 'src/modules/order/dto/create-order.dto';
import { OrderService } from 'src/modules/order/order.service';
import { CreateOrderDetailDto } from 'src/modules/order/dto/create-order-details.dto';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { use } from 'passport';
import { create } from 'domain';
import { string } from 'zod';
import { log } from 'handlebars/runtime';



@Controller('payment')
export class StripeController {
    constructor(
    private readonly stripeService: StripeService,
    private readonly prisma: PrismaService,
     private readonly orderService: OrderService,
  ) {}

  //---------------create-a-payment-using-webhook-----------------\\
@Post('pay')
async pay(@Body() createOrderDto: CreateOrderDto, @Req() req: Request) {
  try {
    //getting user ID from request or from createOrderDto-------------------
    const userId = createOrderDto.user_id || req.user?.userId;
    if (!userId) throw new Error('User ID is missing');

   //getting user details from database-------------------
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true },
    });

    if (!user) throw new Error('User not found');

    // fetching service tiers based on service_tier_ids from order items-------------------
    const serviceTierIds = createOrderDto.order_items.map(item => item.service_tier_id);
    const serviceTiers = await this.prisma.serviceTier.findMany({
      where: { id: { in: serviceTierIds } },
    });

    //mapping service tiers to order items-------------------
    const orderItemsWithDetails = createOrderDto.order_items.map(item => {
      const tier = serviceTiers.find(t => t.id === item.service_tier_id);
      return {
        ...item,
        service_name: tier?.name,
        service_price: tier?.price || 0,
      };
    });

    // calculate total amount
    const totalAmount = orderItemsWithDetails.reduce(
      (sum, item) => sum + (item.service_price ?? 0),
      0
    );

    if (totalAmount <= 0) throw new Error('Amount must be a positive number');

   //calling createPaymentIntent from StripePayment service------------------
    const payment = await StripePayment.createPaymentIntent({
      order_items: orderItemsWithDetails,
      metadata: {
        pakage_name: createOrderDto.pakage_name,
        user_id: userId,
        order_details: JSON.stringify(orderItemsWithDetails.map(item => ({
          service_id: item.service_id,
          service_tier_id: item.service_tier_id,
          quantity: 1,
          service_name: item.service_name,
          service_price: item.service_price,
        }))),
      },
      ammount: totalAmount,
      user_id: userId,
      pakage_name: createOrderDto.pakage_name,
      service_id: createOrderDto.service_id, // Ensure service_id is passed correctly
    });

    console.log('PaymentIntent Created:', payment.client_secret);
    console.log('Metadata:', payment.metadata);

    return {
      clientSecret: payment.client_secret,
      msg: 'PaymentIntent created successfully',
      totalAmount,
    };

  } catch (error) {
    console.error(' Error creating PaymentIntent:', error);
    throw new HttpException(
      {
        statusCode: 500,
        message: 'Error creating payment',
        error: error.message,
      },
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}




@Post('webhook')
  async handleWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() req: Request,
  ) {
    try {
      const payload = req.rawBody.toString();
      const event = await this.stripeService.handleWebhook(payload, signature);

      // Handle events
      switch (event.type) {

              //-------------create-customer---------------- 
        case 'customer.created':
          break;
             //-------------create-payment---------------- 
        case 'payment_intent.created':
          break;
             //-------------paymnet-success---------------- 


case 'payment_intent.succeeded':
  const paymentIntent = event.data.object;

  // test Log metadata to check values-----------------------
  console.log('Payment Intent Metadata:', paymentIntent.metadata);

  // Extract userId and serviceIds from metadata--------------------------
  const userId = paymentIntent.metadata?.user_id || paymentIntent.metadata?.userId;

  // Parse order_details from metadata if present-----------------------
  let orderDetails: any = [];
  let serviceIds: string[] = [];
  if (paymentIntent.metadata?.order_details) {
    try {
      orderDetails = JSON.parse(paymentIntent.metadata.order_details);
      if (Array.isArray(orderDetails)) {
        serviceIds = orderDetails.map((item: any) => item.service_id);
      } else if (orderDetails.service_id) {
        serviceIds = [orderDetails.service_id];
      }
    } catch (e) {
      console.error('Failed to parse order_details:', e);
      orderDetails = [];
      serviceIds = [];
    }
  }


  let serviceTierIds: string[] = [];

  if (paymentIntent.metadata?.order_details) {
    try {
      orderDetails = JSON.parse(paymentIntent.metadata.order_details);

      // getting service_tier_ids from order details --------------------------
      if (Array.isArray(orderDetails)) {
        serviceTierIds = orderDetails.map((item: any) => item.service_tier_id);  
      } else if (orderDetails.service_tier_id) {
        serviceTierIds = [orderDetails.service_tier_id];
      }
    } catch (e) {
      console.error('Failed to parse order_details:', e);
      serviceTierIds = [];
    }
  }

  // test purpose---------------------------------------------------------
  console.log('User ID:', userId);
  console.log('Service Tier IDs:', serviceTierIds);
  console.log('Service IDs:', serviceIds);
  console.log('Order Details:', orderDetails);

  // checcking user ID and fetching user details-------------------
  const user = await this.prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true },
  });

  if (!user) {
    throw new Error('User not found');
  }

  // getting service tiers and services based on IDs -----------------------
  const serviceTiers = await this.prisma.serviceTier.findMany({
    where: { id: { in: serviceTierIds } },
  });

  const services = await this.prisma.service.findMany({
    where: { id: { in: serviceIds } },
  });

  // serviceTiers and services validation---------------------------------
  if (serviceTiers.length !== serviceTierIds.length || services.length !== serviceIds.length) {
    throw new Error('Invalid service or service tier ID');
  }

  // Mapping service tiers and services to order items---------------------
  const orderItems = serviceTiers.map((tier, index) => ({
    service_tier_id: tier.id,
    service_id: services[index]?.id ?? '', 
    service_name: services[index]?.name ?? 'Unknown Service',
    service_amount_name: tier.name ?? 'Unknown Tier',
    service_count: tier.max_post ?? 0,
    service_price: tier.price ?? 0,
  }));

  // Calculate the total amount
  const totalAmount = orderItems.reduce((sum, item) => sum + item.service_price, 0);

  // Create order DTO
  const orderDto: CreateOrderDto = {
    pakage_name: 'Pro Package', 
    order_items: orderItems, 
    ammount: totalAmount,
    user_id: user.id,
    service_id: CreateOrderDto.service_id, 
  };

   const orderCreationResult = await this.orderService.createOrder(user, orderDto);
   console.log('Order created:', orderCreationResult);
//   console.log('Order created:', orderCreationResult);
  // // Optionally check for existing orders with pending payment
  // const checkOrderExists = await this.prisma.order.findFirst({
  //   where: { user_id: user.id, payment_status: 'pending' },
  // });

  // if (checkOrderExists) {
  //   throw new Error('Order already exists with pending payment');
  // }

  // // Create the order
  // const orderCreationResult = await this.orderService.createOrder(user, orderDto);
  // console.log('Order created:', orderCreationResult);

  // Update user type
  await this.prisma.user.update({
    where: { id: user.id },
    data: { type: 'client' },
  });

  // Log the transaction
  await TransactionRepository.updateTransaction({
    reference_number: paymentIntent.id,
    status: 'succeeded',
    paid_amount: paymentIntent.amount / 100,
    paid_currency: paymentIntent.currency,
    raw_status: paymentIntent.status,
  });

  console.log('Order created and subscription activated successfully.');
  break; 

//       
// case 'payment_intent.succeeded':
//   const paymentIntent = event.data.object;

//   // Log metadata to verify the values
//   console.log('Payment Intent Metadata:', paymentIntent.metadata);

//   // Extract userId, service_id, and order details from metadata
//   const userId = paymentIntent.metadata?.user_id || paymentIntent.metadata?.userId;
//   const serviceId = paymentIntent.metadata?.service_id;
//   let serviceTierIds: string[] = [];
//   let orderDetails: any = [];

//   // Parse order_details and extract service tier ids
//   if (paymentIntent.metadata?.order_details) {
//     try {
//       orderDetails = JSON.parse(paymentIntent.metadata.order_details);

//       // Extract service_tier_ids from order details
//       if (Array.isArray(orderDetails)) {
//         serviceTierIds = orderDetails.map((item: any) => item.service_tier_id); // Get all service_tier_ids
//       } else if (orderDetails.service_tier_id) {
//         serviceTierIds = [orderDetails.service_tier_id]; // Single service tier
//       }
//     } catch (e) {
//       console.error('Failed to parse order_details:', e);
//       serviceTierIds = [];
//     }
//   }

//   // Log parsed values
//   console.log('User ID:', userId);
//   console.log('Service Tier IDs:', serviceTierIds);
//   console.log('Order Details:', orderDetails);

//   // Query the user
//   const user = await this.prisma.user.findUnique({
//     where: { id: userId },
//     select: { id: true, name: true, email: true },
//   });

//   if (!user) {
//     throw new Error('User not found');
//   }

//   // Fetch the service tier based on the service_tier_ids
//   const serviceTiers = await this.prisma.serviceTier.findMany({
//     where: { id: { in: serviceTierIds } },
//   });

//   // Fetch the service based on the service_id
//   const service = await this.prisma.service.findUnique({
//     where: { id: serviceId },
//   });

//   // Ensure service tiers and service are valid
//   if (serviceTiers.length !== serviceTierIds.length || !service) {
//     throw new Error('Invalid service or service tier ID');
//   }

//   // Map the service tiers and order details to order items
//   const orderItems = serviceTiers.map((tier, index) => ({
//     service_tier_id: tier.id,
//     service_id: serviceId, // Add service_id to match CreateOrderDetailDto
//     service_name: orderDetails[index]?.service_name ?? 'Unknown Service',
//     service_amount_name: tier.name ?? 'Unknown Tier',
//     service_count: orderDetails[index]?.quantity ?? 0,
//     service_price: orderDetails[index]?.service_price ?? 0,
//   }));

//   // Calculate the total amount
//   const totalAmount = orderItems.reduce((sum, item) => sum + item.service_price, 0);

//   // Create the order DTO
//   const orderDto: CreateOrderDto = {
//     pakage_name: paymentIntent.metadata.package_name || 'Pro Package', // Pass package name from metadata
//     order_items: orderItems,
//     ammount: totalAmount,
//     user_id: user.id,
//     service_id: CreateOrderDto.service_id, // Ensure this is passed correctly
//   };

//   // Optionally check for existing orders with pending payment
//   // const checkOrderExists = await this.prisma.order.findFirst({
//   //   where: { user_id: user.id, payment_status: 'pending' },
//   // });

//   // if (checkOrderExists) {
//   //   throw new Error('Order already exists with pending payment');
//   // }

//   // Create the order
//   const orderCreationResult = await this.orderService.createOrder(user, orderDto);
//   console.log('Order created:', orderCreationResult);

//   // Update user type if needed
//   await this.prisma.user.update({
//     where: { id: user.id },
//     data: { type: 'client' },
//   });

//   // Log the transaction
//   await TransactionRepository.updateTransaction({
//     reference_number: paymentIntent.id,
//     status: 'succeeded',
//     paid_amount: paymentIntent.amount / 100,
//     paid_currency: paymentIntent.currency,
//     raw_status: paymentIntent.status,
//   });

//   console.log('Order created and subscription activated successfully.');
//   break;

//    //-------------paymnet-fail---------------- 
        case 'payment_intent.payment_failed':

          const failedPaymentIntent = event.data.object;
                     const failedOrderId = failedPaymentIntent.metadata?.order_id;
                      await this.prisma.order.update({
              where: { id: failedOrderId },
              data: {
                payment_status: 'due',
              },
            });
          //--------Update-transaction-status-in-database-------------
          await TransactionRepository.updateTransaction({
            reference_number: failedPaymentIntent.id,
            status: 'failed',
            raw_status: failedPaymentIntent.status,
          });
          break;
          //-------------paymnet-canceled---------------- 
        case 'payment_intent.canceled':
          const canceledPaymentIntent = event.data.object;
          //-------Update-transaction-status-in-database---------------
          await TransactionRepository.updateTransaction({
            reference_number: canceledPaymentIntent.id,
            status: 'canceled',
            raw_status: canceledPaymentIntent.status,
          });
          break;
          //-------------paymnet-action---------------- 
        case 'payment_intent.requires_action':
          const requireActionPaymentIntent = event.data.object;
          //-------Update-transaction-status-in-database------------------
          await TransactionRepository.updateTransaction({
            reference_number: requireActionPaymentIntent.id,
            status: 'requires_action',
            raw_status: requireActionPaymentIntent.status,
          });
          break;
          //-------------payout-paid---------------- 
        case 'payout.paid':
          const paidPayout = event.data.object;
          console.log(paidPayout);
          break;
          //-------------payout-faild ---------------- 
        case 'payout.failed':
          const failedPayout = event.data.object;
          console.log(failedPayout);
          break;
          //-------------default---------------- 
        default:
          console.log(` event type ${event.type}`);
      }

      return { received: true };
    } catch (error) {
      console.error('Webhook error', error);
      return { received: false };
    }
  }
}