import { Module } from '@nestjs/common';
import { ResellerService } from './reseller.service';
import { ResellerController } from './reseller.controller';

@Module({
  controllers: [ResellerController],
  providers: [ResellerService],
})
export class ResellerModule {}
