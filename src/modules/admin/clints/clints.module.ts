import { Module } from '@nestjs/common';
import { ClintsService } from './clints.service';
import { ClintsController } from './clints.controller';

@Module({
  controllers: [ClintsController],
  providers: [ClintsService],
})
export class ClintsModule {}
