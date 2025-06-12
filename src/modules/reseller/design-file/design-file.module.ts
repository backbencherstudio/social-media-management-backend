import { Module } from '@nestjs/common';
import { DesignFileService } from './design-file.service';
import { DesignFileController } from './design-file.controller';

@Module({
  providers: [DesignFileService],
  controllers: [DesignFileController]
})
export class DesignFileModule {}
