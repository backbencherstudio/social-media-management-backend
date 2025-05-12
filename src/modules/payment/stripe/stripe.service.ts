import { Injectable } from '@nestjs/common';
import Stripe from 'stripe';
import { CreateStripeDto } from './dto/create-stripe.dto';
import { PrismaService } from '../../../prisma/prisma.service';
import { StripePayment } from 'src/common/lib/Payment/stripe/StripePayment';
import { Prisma } from '@prisma/client';

@Injectable()
export class StripeService {
  private stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16',
  });

  constructor(private readonly prisma: PrismaService) {}

  async createPaymentIntent(dto: CreateStripeDto) {
    const { clientId, adminId, amount, currency, packageName, packageType } = dto;

    const client = await this.prisma.user.findUnique({ where: { id: clientId } });

    if (!client?.billing_id) {
      throw new Error('Client does not have a Stripe customer ID');
    }

    const paymentIntent = await this.stripe.paymentIntents.create({
      amount,
      currency,
      customer: client.billing_id,
      automatic_payment_methods: { enabled: true },
      metadata: {
        clientId,
        adminId,
        packageName,
        packageType,
      },
    });

      await this.prisma.paymentTransaction.create({
    data: {
      user_id: client.id,
      reference_number: paymentIntent.id,
      raw_status: paymentIntent.status,
      amount: new Prisma.Decimal(amount),
      currency,
      status: 'pending',
      provider: 'stripe',
      type: 'order',
    },
  });

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    };
  }

  async handleWebhook(rawBody: string, sig: string | string[]) {
    return StripePayment.handleWebhook(rawBody, sig);
  }
}
