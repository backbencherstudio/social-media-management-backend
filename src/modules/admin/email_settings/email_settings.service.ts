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

async findAll(): Promise<any> {
  try {
    const emailSettings = await this.prisma.emailSettings.findMany();

    if (emailSettings.length === 0) {
      return {
        message: "Currently, this is empty",
        data: []
      };
    }

    return {
      message: "Email settings fetched successfully",
      data: emailSettings
    };
  } catch (error) {
    console.error("Error fetching email settings:", error);
    return {
      message: "An error occurred while fetching email settings.",
      data: []
    };
  }
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
