import { Controller, Post, Body, Get, Param, Put, Delete } from '@nestjs/common';
import { EmailSettings } from '@prisma/client';
import { CreateEmailSettingsDto } from './dto/create-email_setting.dto';
import { EmailSettingsService } from './email_settings.service';
import { UpdateEmailSettingsDto } from './dto/update-email_setting.dto';

@Controller('admin/emailSettings')
export class EmailSettingsController {
  constructor(private readonly emailSettingsService: EmailSettingsService) {}

  // Create email settings
  // @Post()
  // async create(
  //   @Body() createEmailSettingsDto: CreateEmailSettingsDto,
  // ): Promise<EmailSettings> {
  //   return this.emailSettingsService.create(createEmailSettingsDto);
  // }
    // Get all email settings
@Get()
async findAll(): Promise<any> {
  try {
    return await this.emailSettingsService.getEmailSettings();
  } catch (error) {
    return {
      message: "No data available",
      data: []
    };
  }
}

  // Get email settings by ID
  // @Get(':id')
  // async findOne(@Param('id') id: string): Promise<EmailSettings> {
  //   return this.emailSettingsService.findOne(+id); // Convert string id to number
  // }

  // Update email settings by ID
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateEmailSettingsDto: UpdateEmailSettingsDto,
  ): Promise<any> {
    try {
      const updatedSettings = await this.emailSettingsService.update(+id, updateEmailSettingsDto);
      return updatedSettings;
    } catch (error) {
      throw error;
    }
  }

  // Delete email settings by ID
  // @Delete(':id')
  // async remove(@Param('id') id: string): Promise<void> {
  //   return this.emailSettingsService.remove(+id);
  // }
}

