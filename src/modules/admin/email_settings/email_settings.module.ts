import { Module } from '@nestjs/common';
import { EmailSettingsService } from './email_settings.service';
import { EmailSettingsController } from './email_settings.controller';

@Module({
  controllers: [EmailSettingsController],
  providers: [EmailSettingsService],
})
export class EmailSettingsModule {}
