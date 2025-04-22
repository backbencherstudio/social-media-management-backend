// src/feature/feature.module.ts
import { Module } from '@nestjs/common';
import { FeatureServices } from './feature_service';
import { FeatureController } from './feature_controller';
import { PrismaService } from '../../../prisma/prisma.service';

@Module({
  controllers: [FeatureController],
  providers: [FeatureServices, PrismaService],
})
export class FeatureModule {}
