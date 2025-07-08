import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateServiceDto } from './dto/create-service.dto';

@Injectable()
export class ServiceManagementService {
  constructor(private readonly prisma: PrismaService) {}

  // Create a new service with tiers, features, addons, and primary platform
  async createService(dto: CreateServiceDto, userId: string) {
    try {
      // 1. Create the service
      const service = await this.prisma.service.create({
        data: {
          name: dto.name,
          description: dto.description,
          category_id: dto.category_id,
          user_id: userId,
        },
      });

      await Promise.all(
        dto.features.map(async (featureName) => {
          let feature = await this.prisma.feature.findFirst({
            where: { id: featureName },
          });

          if (!feature) {
            feature = await this.prisma.feature.create({
              data: { name: featureName },
            });
          }

          await this.prisma.serviceFeature.create({
            data: {
              service_id: service.id,
              feature_id: feature.id,
            },
          });
        }),
      );

      // 3. Create service tiers
      await Promise.all(
        dto.tiers.map((tier) =>
          this.prisma.serviceTier.create({
            data: {
              service_id: service.id,
              max_post: tier.max_post,
              price: tier.price,
              name: tier.name ?? `${tier.max_post}`,
            },
          }),
        ),
      );

      // 4. Set primary platform (create channel)
      if (dto.primary_platform) {
        await this.prisma.channel.create({
          data: {
            name: dto.primary_platform,
            service_id: service.id,
          },
        });
      }

      // 5. Create addons for extra platforms
      await Promise.all(
        dto.extra_platforms.map((platform) =>
          this.prisma.addon.create({
            data: {
              service_id: service.id,
              name: `Extra ${platform}`,
              price: dto.extra_platform_Price ?? 0,
            },
          }),
        ),
      );

      return {
        success: true,
        message: 'Service created successfully',
        data: {
          service,
        },
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  // Get all services 
  async getAllServices() {
    try {
      const services = await this.prisma.service.findMany({
        where: { deleted_at: null },
        include: {
          service_tiers: {
            where: { status: 1 },
            orderBy: { price: 'asc' },
            take: 1,
          },
          category: true,
          service_features: {
            include: { feature: true },
          },
        },
        orderBy: { created_at: 'desc' },
      });

  // formation updates
      return services.map((service) => ({
        id: service.id,
        name: service.name,
        description : service.description,
        category: service.category?.name ?? '—',
        price: service.service_tiers[0]?.price
          ? `$${service.service_tiers[0].price.toFixed(2)}/mo`
          : 'N/A',
        sale: Math.floor(Math.random() * 50), // dummy data creating here to test purpose 
        status: service.status === 1 ? 'Active' : 'Disable',
        features: service.service_features.map((sf) => sf.feature?.name).filter(Boolean),
      }));
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // Get service by ID with full relations
  async getServiceById(id: string) {
    try {
      return await this.prisma.service.findUnique({
        where: { id },
        include: {
          service_tiers: true,
          addons: true,
          Channel: true,
          category: true,
          service_features: {
            include: { feature: true },
          },
        },
      });
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // Update existing service and replace all tiers, features, addons

  async updateService(id: string, dto: CreateServiceDto) {
  try {
    
    const existingService = await this.prisma.service.findUnique({ where: { id } });
    if (!existingService) {
      return {
        success: false,
        message: `Service with ID '${id}' does not exist.`,
      };
    }

    
    const category = await this.prisma.category.findUnique({
      where: { id: dto.category_id },
    });
    if (!category) {
      return {
        success: false,
        message: `Category ID '${dto.category_id}' does not exist.`,
      };
    }

   
    const updatedService = await this.prisma.service.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        category_id: dto.category_id,
      },
    });

    
    await this.prisma.serviceFeature.deleteMany({ where: { service_id: id } });
    await this.prisma.serviceTier.deleteMany({ where: { service_id: id } });
    await this.prisma.addon.deleteMany({ where: { service_id: id } });

   
    await Promise.all(
      dto.features.map(async (featureName) => {
        let feature = await this.prisma.feature.findFirst({
          where: { id: featureName }, 
         
        });

        if (!feature) {
          feature = await this.prisma.feature.create({
            data: { name: featureName },
          });
        }

        await this.prisma.serviceFeature.create({
          data: {
            service_id: id,
            feature_id: feature.id,
          },
        });
      }),
    );

 
    await Promise.all(
      dto.tiers.map((tier) =>
        this.prisma.serviceTier.create({
          data: {
            service_id: id,
            max_post: tier.max_post,
            price: tier.price,
            name: tier.name ?? `${tier.max_post} Posts`,
          },
        }),
      ),
    );


    if (dto.primary_platform) {
      // Find if a channel exists for this service and platform
      const existingChannel = await this.prisma.channel.findFirst({
        where: {
          service_id: id,
          name: dto.primary_platform,
        },
      });

      if (existingChannel) {
        // Optionally update the channel if needed
        await this.prisma.channel.update({
          where: { id: existingChannel.id },
          data: { name: dto.primary_platform },
        });
      } else {
        await this.prisma.channel.create({
          data: {
            name: dto.primary_platform,
            service_id: id,
          },
        });
      }
    }

    await Promise.all(
      dto.extra_platforms.map((platform) =>
        this.prisma.addon.create({
          data: {
            service_id: id,
            name: `Extra ${platform}`,
            price: dto.extra_platform_Price ?? 0,
          },
        }),
      ),
    );

    return {
      success: true,
      message: 'Service updated successfully',
      data: {
        service_id: updatedService.id,
      },
    };
  } catch (error) {
    return {
      success: false,
      message: error.message,
    };
  }
}

  // Toggle service status between active and disabled
  async toggleServiceStatus(id: string) {
    try {
      const service = await this.prisma.service.findUnique({
        where: { id },
        select: { status: true },
      });

      if (!service) throw new Error('Service not found');

      const newStatus = service.status === 1 ? 0 : 1;

      await this.prisma.service.update({
        where: { id },
        data: { status: newStatus },
      });

      return {
        message: `Service ${newStatus === 1 ? 'enabled' : 'disabled'} successfully`,
        status: newStatus,
      };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // Get services filtered by status (active/inactive)
  async getServicesByStatus(status: number) {
    try {
      const services = await this.prisma.service.findMany({
        where: {
          status,
          deleted_at: null,
        },
        include: {
          service_tiers: {
            where: { status: 1 },
            orderBy: { price: 'asc' },
            take: 1,
          },
          category: true,
          service_features: {
            include: { feature: true },
          },
        },
        orderBy: { created_at: 'desc' },
      });

      if (services.length === 0) {
        return {
          message:
            status === 1
              ? 'No active services currently'
              : 'No inactive services currently',
        };
      }

      return services.map((service) => ({
        id: service.id,
        name: service.name,
        category: service.category?.name ?? '—',
        price: service.service_tiers[0]?.price
          ? `$${service.service_tiers[0].price.toFixed(2)}/mo`
          : 'N/A',
        status: service.status === 1 ? 'Active' : 'Disabled',
        features: service.service_features.map((sf) => sf.feature?.name).filter(Boolean),
      }));
    } catch (error) {
      return { success: false, message: error.message };
    }
  }


  async softDeleteService(id: string) {
  
  const service = await this.prisma.service.findUnique({ where: { id } });

  if (!service) {
    return {
      success: false,
      message: {
        message: `Service with ID ${id} not found`,
        error: 'Not Found',
        statusCode: 404,
      },
    };
  }

  
  if (service.deleted_at) {
    return {
      success: false,
      message: `Service with ID ${id} has already been deleted.`,
    };
  }

 
  await this.prisma.service.update({
    where: { id },
    data: {
      deleted_at: new Date(),
      status: 0, 
    },
  });

  return {
    success: true,
    message: 'Service deleted successfully',
    data: {
      id: service.id,
    },
  };
}

}
