import { Module } from '@nestjs/common';
import { SocialsController } from './socials.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SocialsController],
})
export class SocialsModule {} 