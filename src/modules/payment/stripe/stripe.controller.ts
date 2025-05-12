// import { Controller, Post, Req, Headers } from '@nestjs/common';
// import { StripeService } from './stripe.service';
// import { Request } from 'express';
// import { TransactionRepository } from '../../../common/repository/transaction/transaction.repository';

// @Controller('payment/stripe')
// export class StripeController {
//   constructor(private readonly stripeService: StripeService) {}

//   @Post('webhook')
//   async handleWebhook(
//     @Headers('stripe-signature') signature: string,
//     @Req() req: Request,
//   ) {
//     try {
//       const payload = req.rawBody.toString();
//       const event = await this.stripeService.handleWebhook(payload, signature);

//       // Handle events
//       switch (event.type) {
//         case 'customer.created':
//           break;
//         case 'payment_intent.created':
//           break;
//         case 'payment_intent.succeeded':
//           const paymentIntent = event.data.object;
//           // create tax transaction
//           // await StripePayment.createTaxTransaction(
//           //   paymentIntent.metadata['tax_calculation'],
//           // );
//           // Update transaction status in database
//           await TransactionRepository.updateTransaction({
//             reference_number: paymentIntent.id,
//             status: 'succeeded',
//             paid_amount: paymentIntent.amount / 100, // amount in dollars
//             paid_currency: paymentIntent.currency,
//             raw_status: paymentIntent.status,
//           });
//           break;
//         case 'payment_intent.payment_failed':
//           const failedPaymentIntent = event.data.object;
//           // Update transaction status in database
//           await TransactionRepository.updateTransaction({
//             reference_number: failedPaymentIntent.id,
//             status: 'failed',
//             raw_status: failedPaymentIntent.status,
//           });
//         case 'payment_intent.canceled':
//           const canceledPaymentIntent = event.data.object;
//           // Update transaction status in database
//           await TransactionRepository.updateTransaction({
//             reference_number: canceledPaymentIntent.id,
//             status: 'canceled',
//             raw_status: canceledPaymentIntent.status,
//           });
//           break;
//         case 'payment_intent.requires_action':
//           const requireActionPaymentIntent = event.data.object;
//           // Update transaction status in database
//           await TransactionRepository.updateTransaction({
//             reference_number: requireActionPaymentIntent.id,
//             status: 'requires_action',
//             raw_status: requireActionPaymentIntent.status,
//           });
//           break;
//         case 'payout.paid':
//           const paidPayout = event.data.object;
//           console.log(paidPayout);
//           break;
//         case 'payout.failed':
//           const failedPayout = event.data.object;
//           console.log(failedPayout);
//           break;
//         default:
//           console.log(`Unhandled event type ${event.type}`);
//       }

//       return { received: true };
//     } catch (error) {
//       console.error('Webhook error', error);
//       return { received: false };
//     }
//   }
// }


import {
  Controller,
  Post,
  Body,
  Req,
  Headers,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { StripeService } from './stripe.service';
import { CreateStripeDto } from './dto/create-stripe.dto';
import { Request } from 'express';
import { TransactionRepository } from '../../../common/repository/transaction/transaction.repository';

@Controller('payment/stripe')
export class StripeController {
  constructor(private readonly stripeService: StripeService) {}

  @Post('intent')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async createPaymentIntent(@Body() dto: CreateStripeDto) {
    return this.stripeService.createPaymentIntent(dto);
  }

  @Post('webhook')
  async handleWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() req: Request,
  ) {
    try {
      // 🚨 Will work only if you have bodyParser.raw() configured for this route!
      const payload = req.body.toString(); // this is raw buffer → string

      const event = await this.stripeService.handleWebhook(payload, signature);

      switch (event.type) {
        case 'payment_intent.succeeded':
          const succeeded = event.data.object;
          await TransactionRepository.updateTransaction({
            reference_number: succeeded.id,
            status: 'succeeded',
            paid_amount: succeeded.amount / 100,
            paid_currency: succeeded.currency,
            raw_status: succeeded.status,
          });
          break;

        case 'payment_intent.payment_failed':
          const failed = event.data.object;
          await TransactionRepository.updateTransaction({
            reference_number: failed.id,
            status: 'failed',
            raw_status: failed.status,
          });
          break;

        case 'payment_intent.canceled':
          const canceled = event.data.object;
          await TransactionRepository.updateTransaction({
            reference_number: canceled.id,
            status: 'canceled',
            raw_status: canceled.status,
          });
          break;

        case 'payment_intent.requires_action':
          const requiresAction = event.data.object;
          await TransactionRepository.updateTransaction({
            reference_number: requiresAction.id,
            status: 'requires_action',
            raw_status: requiresAction.status,
          });
          break;

        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      return { received: true };
    } catch (error) {
      console.error('Webhook error:', error.message);
      return { received: false };
    }
  }
}
