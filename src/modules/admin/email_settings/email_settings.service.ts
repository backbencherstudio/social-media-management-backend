import { Injectable, NotFoundException } from '@nestjs/common';

import { EmailSettings } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateEmailSettingsDto } from './dto/create-email_setting.dto';
import { UpdateEmailSettingsDto } from './dto/update-email_setting.dto';

@Injectable()
export class EmailSettingsService {

  constructor(private readonly prisma: PrismaService) {}

  // Create new email settings
  async create(createEmailSettingsDto: CreateEmailSettingsDto): Promise<EmailSettings> {
    return this.prisma.emailSettings.create({
      data: createEmailSettingsDto,
    });
  }

  //find all email_settings 
  async getEmailSettings(): Promise<EmailSettings> {
    const emailSettings = await this.prisma.emailSettings.findFirst();  // Retrieve first record

    if (!emailSettings) {
      throw new NotFoundException('No email settings found in the database.');
    }
    return emailSettings;
  }


  // Find one email setting by ID
  async findOne(id: number): Promise<EmailSettings> {
    const emailSettings = await this.prisma.emailSettings.findUnique({
      where: { id },
    });

    if (!emailSettings) {
      throw new NotFoundException(`Email Settings with ID ${id} not found`);
    }

    return emailSettings;
  }

  // Update email settings
  async update(
    id: number,
    updateEmailSettingsDto: UpdateEmailSettingsDto,
  ): Promise<EmailSettings> {
    const emailSettings = await this.prisma.emailSettings.findUnique({
      where: { id },
    });

    if (!emailSettings) {
      throw new NotFoundException(`Email Settings with ID ${id} not found`);
    }

    return this.prisma.emailSettings.update({
      where: { id },
      data: updateEmailSettingsDto,
    });
  }




  // Delete email settings
  async remove(id: number): Promise<void> {
    const emailSettings = await this.prisma.emailSettings.findUnique({
      where: { id },
    });

    if (!emailSettings) {
      throw new NotFoundException(`Email Settings with ID ${id} not found`);
    }

    await this.prisma.emailSettings.delete({
      where: { id },
    });
  }
}
