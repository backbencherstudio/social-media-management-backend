import { Module } from '@nestjs/common';
import { ActiveServiceService } from './active-service.service';
import { ActiveServiceController } from './active-service.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ActiveServiceController],
  providers: [ActiveServiceService],
})
export class ActiveServiceModule {}
