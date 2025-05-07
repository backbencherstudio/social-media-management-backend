import { Module } from '@nestjs/common';
import { SecuritySettingsController } from './security_settings.controller';
import { SecuritySettingsService } from './security_settings.service';
import { PrismaService } from '../../../../prisma/prisma.service';

@Module({
  controllers: [SecuritySettingsController],
  providers: [SecuritySettingsService, PrismaService],
})
export class SecuritySettingsModule {}
