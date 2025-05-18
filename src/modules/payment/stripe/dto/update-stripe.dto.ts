import { PartialType } from '@nestjs/swagger';
import { CreatePaymentIntentDto } from './create-stripe.dto';

export class UpdateStripeDto extends PartialType(CreatePaymentIntentDto) {}
