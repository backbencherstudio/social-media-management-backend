import { Test, TestingModule } from '@nestjs/testing';
import { EmailSettingsService } from './email_settings.service';

describe('EmailSettingsService', () => {
  let service: EmailSettingsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EmailSettingsService],
    }).compile();

    service = module.get<EmailSettingsService>(EmailSettingsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
