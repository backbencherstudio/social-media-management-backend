import { Controller, Post, Req, Headers, Body } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { Request } from 'express';
import { TransactionRepository } from '../../../common/repository/transaction/transaction.repository';
import { CreatePaymentIntentDto } from './dto/create-stripe.dto';
import { StripePayment } from 'src/common/lib/Payment/stripe/StripePayment';
import { PrismaService } from '../../../prisma/prisma.service';
import { createId } from '@paralleldrive/cuid2';



@Controller('payment')
export class StripeController {
    constructor(
    private readonly stripeService: StripeService,
    private readonly prisma: PrismaService,
  ) {}

  //---------------create-a-payment-using-webhook-----------------\\

@Post('pay')
async pay(@Body() createPaymentIntent: CreatePaymentIntentDto) {
  try {
    
    const now = new Date();
    const end = new Date(now);
    end.setMonth(end.getMonth() + 1); 

  
    const metadata = {
      start_date: now.toISOString(), 
      end_date: end.toISOString(),    
    };

    // Create PaymentIntent with Stripe
    const payment = await StripePayment.createPaymentIntent({
      amount: createPaymentIntent.amount,
      currency: createPaymentIntent.currency || 'usd',
      user_id: createPaymentIntent.user_id,
      customer_id: createPaymentIntent.customer_id,
      service_id: createPaymentIntent.service_id,
      service_tier_id: createPaymentIntent.service_tier_id,
      status: 'active',
      metadata: metadata,  
    });

    console.log('PaymentIntent Created:', payment.client_secret);


    return {
      clientSecret: payment.client_secret, 
      msg: "PaymentIntent created successfully"
    };
  } catch (error) {
    console.log('Error creating PaymentIntent:', error);
    throw error;
  }
}



// in StripeController
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
          const userId = paymentIntent.metadata?.user_id;
          const serviceId = paymentIntent.metadata?.service_id;
          const serviceTierId = paymentIntent.metadata?.service_tier_id;
          const now = new Date();
          const end = new Date(now);
          end.setMonth(end.getMonth() + 1);
// -----------------creating-subscription--------------------\\
          const subscription = await this.prisma.subscription.create({
            data: {
              user: {
                connect: { id: userId },
              },
              service: {
                connect: { id: serviceId },
              },
              service_tier: {
                connect: { id: serviceTierId },
              },
              start_at: now,
              end_at: end,
              status: 'active',
            },
          });

//-------------------order -created-----------------------------------\\
const serviceTier = paymentIntent.metadata?.service_tier_id;

const tier = await this.prisma.serviceTier.findUnique({
  where: { id: serviceTier },
});

if (!tier) {
  throw new Error('Service tier not found');
}

        const user = await this.prisma.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            name: true,
            email: true,
          },
        });

        if (!user) {
          throw new Error('User not found');
        }
        const order = await this.prisma.order.create({
        data: {
        id: `#ORD_${createId()}`,
        order_type: 'progress', 
        subscription_id: subscription.id, 
        user_id: userId,
        user_name: user.name,
        user_email: user.email,
        ammount:tier.price,
          },
         });

       console.log("order is created");
       
        await TransactionRepository.updateTransaction({
          reference_number: paymentIntent.id,
          status: 'succeeded',
          paid_amount: paymentIntent.amount / 100,
          paid_currency: paymentIntent.currency,
          raw_status: paymentIntent.status,
        });

        break;

          //-------------paymnet-fail---------------- 
        case 'payment_intent.payment_failed':
          const failedPaymentIntent = event.data.object;
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