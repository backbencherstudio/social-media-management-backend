import { Module } from '@nestjs/common';
import { ResellerProfileService } from './reseller_profile.service';
import { ResellerProfileController } from './reseller_profile.controller';

@Module({
  controllers: [ResellerProfileController],
  providers: [ResellerProfileService],
})
export class ResellerProfileModule {}
