import { Module } from '@nestjs/common';
import { ActiveServiceService } from './active-service.service';
import { ActiveServiceController } from './active-service.controller';

@Module({
  controllers: [ActiveServiceController],
  providers: [ActiveServiceService],
})
export class ActiveServiceModule {}
