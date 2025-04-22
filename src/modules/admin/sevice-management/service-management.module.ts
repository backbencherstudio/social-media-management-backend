import { Module } from '@nestjs/common';
import { ServiceManagementController } from './service_management_controller';
import { ServiceManagementService } from './service-management.service';
import { PrismaService } from 'src/prisma/prisma.service'; // Make sure path is correct

@Module({
  controllers: [ServiceManagementController],
  providers: [ServiceManagementService, PrismaService],
})
export class ServiceManagementModule {}
