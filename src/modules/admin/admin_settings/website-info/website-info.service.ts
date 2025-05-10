import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { UpdateWebsiteInfoDto } from './dto/update-website-info.dto';
import { SojebStorage } from '../../../../common/lib/Disk/SojebStorage';
import appConfig from '../../../../config/app.config';

@Injectable()
export class WebsiteInfoService {
  constructor(private prisma: PrismaService) {}
  async getInfo() {
    try {
      const websiteInfo = await this.prisma.websiteInfo.findFirst({
        select: {
          id: true,
          site_name: true,
          site_description: true,
          time_zone: true,
          phone_number: true,
          email: true,
          address: true,
          logo: true,
          favicon: true,
          copyright: true,
          cancellation_policy: true,
        },
      });

      if (!websiteInfo) {
        return {
          success: false,
          message: 'Website information not found',
        };
      }

      if (websiteInfo.logo) {
        websiteInfo['logo_url'] = SojebStorage.url(
          appConfig().storageUrl.websiteInfo + websiteInfo.logo,
        );
      }

      if (websiteInfo.favicon) {
        websiteInfo['favicon_url'] = SojebStorage.url(
          appConfig().storageUrl.websiteInfo + websiteInfo.favicon,
        );
      }

      return {
        success: true,
        data: websiteInfo,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        error.message || 'Failed to fetch website info',
      );
    }
  }

  async updateInfo(
    dto: UpdateWebsiteInfoDto,
    files?: {
      logo?: Express.Multer.File[];
      favicon?: Express.Multer.File[];
    },
  ) {
    try {
      const existing = await this.prisma.websiteInfo.findFirst();
      if (!existing) throw new NotFoundException('Website settings not found.');

      const data: any = {
        ...dto,
        updated_at: new Date(),
      };

      // Handle logo upload
      if (files?.logo?.[0]) {
        if (existing.logo) {
          await SojebStorage.delete(
            appConfig().storageUrl.websiteInfo + existing.logo,
          );
        }
        data.logo = files.logo[0].filename;
      }

      // Handle favicon upload
      if (files?.favicon?.[0]) {
        if (existing.favicon) {
          await SojebStorage.delete(
            appConfig().storageUrl.websiteInfo + existing.favicon,
          );
        }
        data.favicon = files.favicon[0].filename;
      }

      const updated = await this.prisma.websiteInfo.update({
        where: { id: existing.id },
        data,
      });

      return {
        success: true,
        message: 'Website settings updated successfully',
        data: updated,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        error.message || 'Failed to update website settings',
      );
    }
  }

  async restoreDefaults() {
    try {
      const existing = await this.prisma.websiteInfo.findFirst();
      if (!existing) throw new NotFoundException('Website settings not found.');

      // Delete old files
      if (existing.logo) {
        await SojebStorage.delete(
          appConfig().storageUrl.websiteInfo + existing.logo,
        );
      }
      if (existing.favicon) {
        await SojebStorage.delete(
          appConfig().storageUrl.websiteInfo + existing.favicon,
        );
      }

      const reset = await this.prisma.websiteInfo.update({
        where: { id: existing.id },
        data: {
          site_name: 'Default Site',
          site_description: 'Default description',
          time_zone: 'UTC',
          phone_number: '1234567890',
          email: 'admin@example.com',
          address: 'Default address',
          logo: null,
          favicon: null,
          copyright: '',
          cancellation_policy: '',
          updated_at: new Date(),
        },
      });

      return {
        success: true,
        message: 'Website settings restored to defaults',
        data: reset,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        error.message || 'Failed to restore website settings',
      );
    }
  }
}
