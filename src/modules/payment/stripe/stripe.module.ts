import { Module } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { StripeController } from './stripe.controller';
import { PassportModule } from '@nestjs/passport/dist/passport.module';
import { AuthModule } from 'src/modules/auth/auth.module';
import { OrderModule } from 'src/modules/order/order.module';

@Module({
  imports: [OrderModule],
  controllers: [StripeController],
  providers: [StripeService],
})
export class StripeModule {}
