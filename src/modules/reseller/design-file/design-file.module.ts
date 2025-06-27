import { Module } from '@nestjs/common';
import { DesignFileService } from './design-file.service';
import { DesignFileController } from './design-file.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [DesignFileService],
  controllers: [DesignFileController],
  exports: [DesignFileService],
})
export class DesignFileModule { }
