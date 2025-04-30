import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateServiceDto } from './dto/create-service.dto';

@Injectable()
export class ServiceManagementService {
  updateService: any;
  softDeleteService: any;

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

      // 2. Link features (create if not exists)
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

      // 4. Set primary platform (upsert channel)
      if (dto.primary_platform) {
        await this.prisma.channel.upsert({
          where: { name: dto.primary_platform },
          update: {},
          create: { name: dto.primary_platform },
        });
      }

      // 5. Create addons for extra platforms
      await Promise.all(
        dto.extra_platforms.map((platform) =>
          this.prisma.addon.create({
            data: {
              service_id: service.id,
              name: `Extra ${platform}`,
              price: dto.extra_platform_price ?? 0,
            },
          }),
        ),
      );

      return {
        success: true,
        message: 'Service created successfully',
        data: {
          service_id: service.id,
        },
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  // Get all services with related data
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

      // Format for UI
      return services.map((service) => ({
        id: service.id,
        name: service.name,
        category: service.category?.name ?? '—',
        price: service.service_tiers[0]?.price
          ? `$${service.service_tiers[0].price.toFixed(2)}/mo`
          : 'N/A',
        sale: Math.floor(Math.random() * 50), // Fake sale data for now
        status: service.status === 1 ? 'Active' : 'Disable',
        features: service.service_features.map((sf) => sf.feature?.name).filter(Boolean),
      }));
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // ✅ Get service by ID with full relations
  async getServiceById(id: string) {
    try {
      return await this.prisma.service.findUnique({
        where: { id },
        include: {
          service_tiers: true,
          addons: true,
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

  // ✅ Update existing service and replace all tiers, features, addons
  async updateServices(id: string, dto: CreateServiceDto) {
    try {
      // 1. Update main service record
      const service = await this.prisma.service.update({
        where: { id },
        data: {
          name: dto.name,
          description: dto.description,
          category_id: dto.category_id,
        },
      });

      // 2. Remove old related data
      await this.prisma.serviceTier.deleteMany({ where: { service_id: id } });
      await this.prisma.addon.deleteMany({ where: { service_id: id } });
      await this.prisma.serviceFeature.deleteMany({ where: { service_id: id } });

      // 3. Recreate tiers
      await Promise.all(
        dto.tiers.map((tier) =>
          this.prisma.serviceTier.create({
            data: {
              service_id: id,
              price: tier.price,
              max_post: tier.max_post,
              name: tier.name ?? `${tier.max_post}`,
            },
          }),
        ),
      );

      // 4. Recreate addons
      await Promise.all(
        dto.extra_platforms.map((platform) =>
          this.prisma.addon.create({
            data: {
              service_id: id,
              name: `Extra ${platform}`,
              price: dto.extra_platform_price ?? 10,
            },
          }),
        ),
      );

      // 5. Recreate features
      await Promise.all(
        dto.features.map(async (featureName) => {
          let feature = await this.prisma.feature.findFirst({ where: { name: featureName } });
          if (!feature) {
            feature = await this.prisma.feature.create({ data: { name: featureName } });
          }
          await this.prisma.serviceFeature.create({
            data: { service_id: id, feature_id: feature.id },
          });
        }),
      );

      return { message: 'Service updated successfully', service_id: service.id };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // ✅ Toggle service status between active and disabled
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

  // ✅ Get services filtered by status (active/inactive)
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
}
