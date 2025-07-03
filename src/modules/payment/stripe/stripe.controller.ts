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


case 'payment_intent.succeeded': {
  const paymentIntent = event.data.object;
  const metadata = paymentIntent.metadata;

  // Log incoming metadata
  console.log('✅ Payment Intent Metadata:', metadata);

  const userId = metadata?.user_id;
  const serviceIds = metadata?.service_ids?.split(',') ?? [];
  const serviceTierIds = metadata?.service_tier_ids?.split(',') ?? [];

  // Defensive checks
  if (!userId) throw new Error('User ID missing in metadata');
  if (!serviceIds.length || !serviceTierIds.length) {
    throw new Error('Missing service IDs or tier IDs');
  }

  // Fetch user
  const user = await this.prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true },
  });
  if (!user) throw new Error('User not found');

  // Fetch tiers and services
  const [serviceTiers, services] = await Promise.all([
    this.prisma.serviceTier.findMany({ where: { id: { in: serviceTierIds } } }),
    this.prisma.service.findMany({ where: { id: { in: serviceIds } } }),
  ]);

  if (serviceTiers.length !== serviceTierIds.length || services.length !== serviceIds.length) {
    throw new Error('Invalid service or service tier IDs');
  }

  // Create mapped order items
  const orderItems = serviceTiers.map((tier, i) => ({
    service_tier_id: tier.id,
    service_id: serviceIds[i] ?? '', // Ensure fallback
    service_name: services[i]?.name ?? 'Unknown Service',
    service_amount_name: tier.name ?? 'Unknown Tier',
    service_count: tier.max_post ?? 0,
    service_price: tier.price ?? 0,
  }));

  const totalAmount = orderItems.reduce((sum, item) => sum + item.service_price, 0);

  const orderDto: CreateOrderDto = {
    pakage_name: metadata.package_name,
    order_items: orderItems,
    ammount: totalAmount,
    user_id: user.id,
    service_id: CreateOrderDto.service_id, 
  };

  const orderCreationResult = await this.orderService.createOrder(user, orderDto);
  console.log('Order created:', orderCreationResult);

  // Update user type
  await this.prisma.user.update({
    where: { id: user.id },
    data: { type: 'client' },
  });
  
    await this.prisma.paymentTransaction.create({
      data: {
        user_id: user.id,
        amount: totalAmount,
        currency: 'usd',
        status: 'success',
        type: 'payment',
      },
    });

  // Save transaction
  await TransactionRepository.updateTransaction({
    reference_number: paymentIntent.id,
    status: 'succeeded',
    paid_amount: paymentIntent.amount / 100,
    paid_currency: paymentIntent.currency,
    raw_status: paymentIntent.status,
  });

  console.log('Order created and subscription activated.');
  break;
}
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