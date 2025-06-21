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


  //extra methods can be added here as needed
  //task insite
   async getTaskInside() {
    try {
      const task = await this.prisma.taskAssign.findMany({
        orderBy: {
          created_at: 'desc',
        },
      });

      if (!task.length) {
        return { message: 'No tasks found', tasks: [] };
      }

      return { message: 'Tasks fetched successfully', 
        data:{
          total_tasks: task.length,
          in_progress_tasks: task.filter(t => t.status === 'In_progress').length,
          completed_tasks: task.filter(t => t.status === 'completed').length,
          pending_tasks: task.filter(t => t.status === 'pending').length,
          pending_review: task.filter(t => t.status === 'pending_review').length,

        }
       };
    } catch (error) {
      throw new InternalServerErrorException(
        error.message || 'Failed to fetch tasks',
      );
    } 
}

//top performing services
async getTopPerformingServices() {
  try {
    const orders = await this.prisma.order.findMany({
      select: {
        pakage_name: true,
        ammount: true,
      },
    });


    const packageStats: Record<string, { total_sold: number; total_amount: number }> = {};

    for (const order of orders) {
      const name = order.pakage_name;
      const amount = order.ammount;

      if (!packageStats[name]) {
        packageStats[name] = { total_sold: 0, total_amount: 0 };
      }

      packageStats[name].total_sold += 1;
      packageStats[name].total_amount += amount;
    }

 
    const result = Object.entries(packageStats).map(([name, stats]) => ({
      package_name: name,
      total_sold: stats.total_sold,
      total_amount: stats.total_amount,
    }));

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error('Error retrieving orders:', error);
    throw error;
  }
}

//top resellera
async getTopResellers() {
  try {
    const resellers = await this.prisma.reseller.findMany({
      include: {
        user: true,
        reseller_application: true,
        TaskAssign: true,
      },
    });

    const data = resellers.map((reseller) => ({
      id: reseller.reseller_id,
      full_name: reseller.full_name,
      user_email: reseller.user_email,
      total_earnings: reseller.total_earnings || 0,
    }));

    //------------Sort by total_earnings in descending order-----------
    const sortedData = data.sort((a, b) => b.total_earnings - a.total_earnings);

    //-------------Pick top 4 resellers--------------
    const topResellers = sortedData.slice(0, 4);

    return {
      success: true,
      message: 'Top Resellers fetched successfully',
      data: topResellers,
    };
  } catch (error) {
    console.error('Error fetching resellers:', error);
    return {
      success: false,
      message: `Error fetching resellers: ${error.message}`,
    };
  }
}

//new Orders
async getRecentOrders() {
  try {
    const recentOrders = await this.prisma.order.findMany({
      take: 5, 
      orderBy: {
        created_at: 'desc', 
      },
      select: {
        id: true,
        created_at: true,
        order_status: true,
        subscription_id: true,
        ammount: true,
        pakage_name: true,
        user_email: true,
        user_name: true,
        user_id: true,
        payment_status: true,
        subscription: {
          select: {
            service_id: true,
            service_tier_id: true,
          },
        },
      },
    });

    return {
      success: true,
      message: "Latest 5 orders fetched successfully",
      data: recentOrders,
    };
  } catch (error) {
    console.error('Error retrieving recent orders:', error);
    return {
      success: false,
      message: `Error fetching recent orders: ${error.message}`,
    };
  }
}


}
