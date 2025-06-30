import stripe from 'stripe';
import appConfig from '../../../../config/app.config';
import { Fetch } from '../../Fetch';
import * as fs from 'fs';
import { CreateOrderDto } from 'src/modules/order/dto/create-order.dto';

const STRIPE_SECRET_KEY = appConfig().payment.stripe.secret_key;

const Stripe = new stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2025-05-28.basil'
});

const STRIPE_WEBHOOK_SECRET = appConfig().payment.stripe.webhook_secret;
/**
 * Stripe payment method helper
 */
export class StripePayment {
  static async createPaymentMethod({
    card,
    billing_details,
  }: {
    card: stripe.PaymentMethodCreateParams.Card;
    billing_details: stripe.PaymentMethodCreateParams.BillingDetails;
  }): Promise<stripe.PaymentMethod> {
    const paymentMethod = await Stripe.paymentMethods.create({
      card: {
        number: card.number,
        exp_month: card.exp_month,
        exp_year: card.exp_year,
        cvc: card.cvc,
      },
      billing_details: billing_details,
    });
    return paymentMethod;
  }

  /**
   * Add customer to stripe
   * @param email
   * @returns
   */
  static async createCustomer({
    user_id,
    name,
    email,
  }: {
    user_id: string;
    name: string;
    email: string;
  }): Promise<stripe.Customer> {
    const customer = await Stripe.customers.create({
      name: name,
      email: email,
      metadata: {
        user_id: user_id,
      },
      description: 'New Customer',
    });
    return customer;
  }

  static async attachCustomerPaymentMethodId({
    customer_id,
    payment_method_id,
  }: {
    customer_id: string;
    payment_method_id: string;
  }): Promise<stripe.PaymentMethod> {
    const customer = await Stripe.paymentMethods.attach(payment_method_id, {
      customer: customer_id,
    });
    return customer;
  }

  static async setCustomerDefaultPaymentMethodId({
    customer_id,
    payment_method_id,
  }: {
    customer_id: string;
    payment_method_id: string;
  }): Promise<stripe.Customer> {
    const customer = await Stripe.customers.update(customer_id, {
      invoice_settings: {
        default_payment_method: payment_method_id,
      },
    });
    return customer;
  }

  static async updateCustomer({
    customer_id,
    name,
    email,
  }: {
    customer_id: string;
    name: string;
    email: string;
  }): Promise<stripe.Customer> {
    const customer = await Stripe.customers.update(customer_id, {
      name: name,
      email: email,
    });
    return customer;
  }

  /**
   * Get customer using id
   * @param id
   * @returns
   */
  static async getCustomerByID(id: string): Promise<stripe.Customer> {
    const customer = await Stripe.customers.retrieve(id);
    return customer as stripe.Customer;
  }

  /**
   * Create billing portal session
   * @param customer
   * @returns
   */
  static async createBillingSession(customer: string) {
    const session = await Stripe.billingPortal.sessions.create({
      customer: customer,
      return_url: appConfig().app.url,
    });
    return session;
  }

  // static async createPaymentIntent({
  //   amount,
  //   currency,
  //   customer_id,
  //   metadata,
  // }: {
  //   amount: number;
  //   currency: string;
  //   customer_id: string;
  //   metadata?: stripe.MetadataParam;
  // }): Promise<stripe.PaymentIntent> {
  //   return Stripe.paymentIntents.create({
  //     amount: amount * 100, // amount in cents
  //     currency: currency,
  //     customer: customer_id,
  //     metadata: metadata,
  //   });
  // }


// static async createPaymentIntent({
//   amount,
//   currency,
//   user_id,
//   customer_id,
//   service_id,
//   service_tier_id,
//   status,
//   metadata,
// }: {
//   amount: number;
//   currency: string;
//   user_id: string;
//   customer_id: string;
//   service_id: string;
//   service_tier_id: string;
//   status: string;
//   metadata: {
//     start_date: string;
//     end_date: string;
//   };
// }): Promise<stripe.PaymentIntent> {
//   if (!amount || amount <= 0) {
//     throw new Error('Amount must be a positive number');
//   }
//   if (!currency) {
//     throw new Error('Currency is required');
//   }
//   if (!user_id || !customer_id || !service_id || !service_tier_id) {
//     throw new Error('All IDs are required');
//   }
//   if (!metadata || !metadata.start_date || !metadata.end_date) {
//     throw new Error('Metadata with start_date and end_date is required');
//   }

//   try {
    
//     return await Stripe.paymentIntents.create({
//       amount: Math.round(amount * 100), 
//       currency: currency.toLowerCase(), 
//       customer: customer_id,
//       metadata: { //pushing to meta data----------------\\
//         user_id,           
//         service_id,        
//         service_tier_id,   
//         status,            
//         start_date: metadata.start_date, 
//         end_date: metadata.end_date,     
//       },
//     });
//   } catch (error) {
//     console.error('Failed to create PaymentIntent:', error);
//     throw new Error('Failed to create payment intent');
//   }
// }

static async createPaymentIntent(orderDto: CreateOrderDto) {
  try {
    const totalAmount = orderDto.order_items.reduce((sum, item) => sum + (item.service_price ?? 0), 0);
    const orderId = `ORD_${Date.now()}`;

    // Prepare only compact metadata (avoid large strings)
    const serviceTierIds = orderDto.order_items.map(item => item.service_tier_id).join(',');
    const serviceIds = orderDto.order_items.map(item => item.service_id).join(',');

    return await Stripe.paymentIntents.create({
      amount: totalAmount * 100, // Convert dollars to cents
      currency: 'usd',
      metadata: {
        order_id: orderId,
        package_name: orderDto.pakage_name,
        user_id: orderDto.user_id || 'default_user_id',
        service_tier_ids: serviceTierIds,
        service_ids: serviceIds,
        item_count: orderDto.order_items.length.toString()
      },
    });
  } catch (error) {
    console.error('❌ Error creating PaymentIntent:', error);
    throw new Error('Failed to create PaymentIntent');
  }
}


  /**
   * Create stripe hosted checkout session
   * @param customer
   * @param price
   * @returns
   */
  static async createCheckoutSession(customer: string, price: string,duration: string) {
    const success_url = `${
      appConfig().app.url
    }/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancel_url = `${appConfig().app.url}/failed`;

    const session = await Stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer: customer,
      line_items: [
        {
          price: price,
          quantity: 1,
        },
      ],
      subscription_data: {
        trial_period_days: 14,
      },
      success_url: success_url,
      cancel_url: cancel_url,
      //-----------------for dynamic time-------------
       metadata: { duration: duration.toString() }
      // automatic_tax: { enabled: true },
    });
    return session;
  }

  static async setSubscriptionCancelAt(subscriptionId: string, cancelAt: number) {
  return Stripe.subscriptions.update(subscriptionId, { cancel_at: cancelAt });
}

  //  static async createCheckoutSession(customer: string, price: string, duration: string) {
  //   try {
  //     // Construct success and cancel URLs
  //     const success_url = `${appConfig().app.url}/success?session_id={CHECKOUT_SESSION_ID}`;
  //     const cancel_url = `${appConfig().app.url}/failed`;

  //     // Create the checkout session
  //     const session = await Stripe.checkout.sessions.create({
  //       mode: 'subscription',
  //       payment_method_types: ['card'],
  //       customer: customer,
  //       line_items: [
  //         {
  //           price: price,  // Ensure this is a valid recurring price ID
  //           quantity: 1,
  //         },
  //       ],
  //       subscription_data: {
  //         trial_period_days: 14, // Optional trial period
  //       },
  //       success_url: success_url,
  //       cancel_url: cancel_url,
  //       metadata: { duration: duration.toString() }, // Store custom duration
  //     });

  //     console.log('Checkout session created successfully:', session.id);
  //     return { sessionId: session.id, url: session.url };
  //   } catch (error) {
  //     console.error('Error creating checkout session:', error.message);
  //     throw new Error('Failed to create checkout session');
  //   }
  // }

  // /**
  //  * Set the subscription's cancel_at field based on the given duration
  //  * @param subscriptionId - Stripe subscription ID
  //  * @param cancelAt - Timestamp (in seconds) when to cancel the subscription
  //  * @returns The updated subscription
  //  */
  // static async setSubscriptionCancelAt(subscriptionId: string, cancelAt: number) {
  //   try {
  //     // Ensure cancelAt is a valid future date (in seconds)
  //     const currentTimestamp = Math.floor(Date.now() / 1000);
  //     if (cancelAt <= currentTimestamp) {
  //       throw new Error('The cancelAt timestamp must be a future date.');
  //     }

  //     // Update the subscription's cancel_at field
  //     const updatedSubscription = await Stripe.subscriptions.update(subscriptionId, {
  //       cancel_at: cancelAt,
  //     });

  //     console.log('Subscription updated with cancel_at:', updatedSubscription.id);
  //     return updatedSubscription;
  //   } catch (error) {
  //     console.error('Error setting cancel_at for subscription:', error.message);
  //     throw new Error('Failed to set cancel_at for subscription');
  //   }
  // }

  /**
   * Calculate taxes
   * @param amount
   * @returns
   */
  static async calculateTax({
    amount,
    currency,
    customer_details,
  }: {
    amount: number;
    currency: string;
    customer_details: stripe.Tax.CalculationCreateParams.CustomerDetails;
  }): Promise<stripe.Tax.Calculation> {
    const taxCalculation = await Stripe.tax.calculations.create({
      currency: currency,
      customer_details: customer_details,
      line_items: [
        {
          amount: amount * 100,
          tax_behavior: 'exclusive',
          reference: 'tax_calculation',
        },
      ],
    });
    return taxCalculation;
  }

  // create a tax transaction
  static async createTaxTransaction(
    tax_calculation: string,
  ): Promise<stripe.Tax.Transaction> {
    const taxTransaction = await Stripe.tax.transactions.createFromCalculation({
      calculation: tax_calculation,
      reference: 'tax_transaction',
    });
    return taxTransaction;
  }

  // download invoice using payment intent id
  static async downloadInvoiceUrl(
    payment_intent_id: string,
  ): Promise<string | null> {
    const invoice = await Stripe.invoices.retrieve(payment_intent_id);
    // check if the invoice has  areceipt url
    if (invoice.hosted_invoice_url) {
      return invoice.hosted_invoice_url;
    }
    return null;
  }

  // download invoice using payment intent id
  static async downloadInvoiceFile(payment_intent_id: string) {
    const invoice = await Stripe.invoices.retrieve(payment_intent_id);

    if (invoice.hosted_invoice_url) {
      const response = await Fetch.get(invoice.hosted_invoice_url, {
        responseType: 'stream',
      });

      // save the response to a file
      return fs.writeFileSync('receipt.pdf', response.data);
    } else {
      return null;
    }
  }

  // send invoice to email using payment intent id
  static async sendInvoiceToEmail(payment_intent_id: string) {
    const invoice = await Stripe.invoices.sendInvoice(payment_intent_id);
    return invoice;
  }

  // -----------------------payout system start--------------------------------

  // If you are paying users, they need Stripe Connect accounts. You can create Express or Standard accounts.
  static async createConnectedAccount(email: string) {
    const connectedAccount = await Stripe.accounts.create({
      type: 'express',
      email: email,
      country: 'US', // change as per user's country
      // business_profile: {
      //   url: appConfig().app.url,
      // },
      // settings: {
      //   payouts: {
      //     schedule: {
      //       interval: 'manual',
      //     },
      //   },
      // },
      capabilities: {
        // card_payments: {
        //   enabled: true,
        // },
        transfers: {
          // enabled: true,
          requested: true,
        },
      },
    });

    return connectedAccount;
  }

  // Before making payouts, users must complete Stripe Connect onboarding.
  static async createOnboardingAccountLink(account_id: string) {
    const accountLink = await Stripe.accountLinks.create({
      account: account_id,
      refresh_url: appConfig().app.url,
      return_url: appConfig().app.url,
      type: 'account_onboarding',
    });

    return accountLink;
  }

  // Once the user has an approved Stripe account with a linked bank, you can send them funds.
  //REal
//   static async createPayout(
// account_id: string, amount: number, currency: string, metadata: { user_id: string; account_id: string; transaction_id: string; },
//   ) {
//     const payout = await Stripe.payouts.create({
//       amount: amount * 100, // amount in cents
//       currency: currency,
//       destination: account_id,
//     });

//     return payout;
//   }

//Testing



  static async createPayout(
    connectedAccountId: string,
    amount: number,
    currency: string,
    metadata: { user_id: string; account_id: string; transaction_id: string }
  ) {
    try {
      const payout = await Stripe.payouts.create(
        {
          amount: Math.round(amount * 100), // amount in cents
          currency,
          metadata,
        },
        {
          stripeAccount: connectedAccountId, // ✅ This tells Stripe the payout is from the connected account
        }
      );

      return payout;
    } catch (error) {
      console.error('Stripe payout error:', error);
      throw error;
    }
  }

  // static async createPayout(amount: number, currency: string) {
  //   const payout = await Stripe.payouts.create({
  //     amount: amount * 100,
  //     currency: currency,
  //   });
  //   return payout;
  // }
  // -----------------------payout system end--------------------------------

  static handleWebhook(rawBody: string, sig: string | string[]): stripe.Event {
    const event = Stripe.webhooks.constructEvent(
      rawBody,
      sig,
      STRIPE_WEBHOOK_SECRET,
    );
    return event;
  }
}
