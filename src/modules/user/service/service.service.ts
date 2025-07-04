import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ServiceService {
    constructor(private readonly prisma: PrismaService) { }

    // Get all active services for users
    async getAllServices() {
        try {
            const services = await this.prisma.service.findMany({
                where: {
                    deleted_at: null,
                    status: 1 // Only active services
                },
                include: {
                    service_tiers: {
                        where: { status: 1 },
                        orderBy: { price: 'asc' },
                    },
                    category: true,
                    service_features: {
                        include: { feature: true },
                    },
                    addons: {
                        where: { status: 1 },
                    },
                },
                orderBy: { created_at: 'desc' },
            });

            // Format the response
            const formattedServices = services.map((service) => ({
                id: service.id,
                name: service.name,
                description: service.description,
                category: service.category?.name ?? '—',
                category_id: service.category_id,
                price_range: service.service_tiers.length > 0
                    ? {
                        min: Math.min(...service.service_tiers.map(tier => tier.price || 0)),
                        max: Math.max(...service.service_tiers.map(tier => tier.price || 0)),
                        currency: 'USD'
                    }
                    : null,
                starting_price: service.service_tiers[0]?.price
                    ? `$${service.service_tiers[0].price.toFixed(2)}/mo`
                    : 'N/A',
                features: service.service_features.map((sf) => sf.feature?.name).filter(Boolean),
                addons: service.addons.map(addon => ({
                    id: addon.id,
                    name: addon.name,
                    description: addon.description,
                    price: addon.price,
                    max_count: addon.max_count
                })),
                tiers: service.service_tiers.map(tier => ({
                    id: tier.id,
                    name: tier.name,
                    price: tier.price,
                    max_post: tier.max_post
                })),
                created_at: service.created_at,
                updated_at: service.updated_at,
            }));

            return {
                success: true,
                data: formattedServices,
                total: formattedServices.length
            };
        } catch (error) {
            return {
                success: false,
                message: error.message,
            };
        }
    }

    // Get single service by ID with full details
    async getServiceById(id: string, userId: string) {
        try {
            const service = await this.prisma.service.findUnique({
                where: {
                    id,
                    deleted_at: null,
                },
                include: {
                    service_tiers: {
                        where: { status: 1 },
                        orderBy: { price: 'asc' },
                    },
                    category: true,
                    service_features: {
                        include: { feature: true },
                    },
                    addons: {
                        where: { status: 1 },
                    },
                    user: {
                        select: {
                            id: true,
                            name: true,
                            username: true,
                            avatar: true,
                        }
                    },
                },
            });

            if (!service) {
                return {
                    success: false,
                    message: 'Service not found or not available',
                };
            }

            const tierIds = service.service_tiers.map(tier => tier.id);

            // Then, get the user's order for this service (if any)
            const order = await this.prisma.order.findFirst({
                where: {
                    user_id: userId,
                    service_tier_id: { in: tierIds },
                },
                include: {
                    subscription: true,
                }
            });

            // Format the order details (assuming one order per user per service)
            let orderDetails = null;
            if (order) {
                orderDetails = {
                    orderId: order.id,
                    status: order.order_status,
                    started: order.created_at,
                    payment: order.payment_status,
                    subscription: order.subscription?.status,
                };
            }

            // Format the response
            const formattedService = {
                id: service.id,
                name: service.name,
                description: service.description,
                category: service.category?.name ?? '—',
                category_id: service.category_id,
                seller: service.user ? {
                    id: service.user.id,
                    name: service.user.name,
                    username: service.user.username,
                    avatar: service.user.avatar,
                } : null,
                price_range: service.service_tiers.length > 0
                    ? {
                        min: Math.min(...service.service_tiers.map(tier => tier.price || 0)),
                        max: Math.max(...service.service_tiers.map(tier => tier.price || 0)),
                        currency: 'USD'
                    }
                    : null,
                starting_price: service.service_tiers[0]?.price
                    ? `$${service.service_tiers[0].price.toFixed(2)}/mo`
                    : 'N/A',
                features: service.service_features.map((sf) => sf.feature?.name).filter(Boolean),
                addons: service.addons.map(addon => ({
                    id: addon.id,
                    name: addon.name,
                    description: addon.description,
                    price: addon.price,
                    max_count: addon.max_count
                })),
                tiers: service.service_tiers.map(tier => ({
                    id: tier.id,
                    name: tier.name,
                    price: tier.price,
                    max_post: tier.max_post
                })),
                created_at: service.created_at,
                updated_at: service.updated_at,
                order: orderDetails,
            };

            return {
                success: true,
                data: formattedService,
            };
        } catch (error) {
            return {
                success: false,
                message: error.message,
            };
        }
    }

    async getPurchasedServicesByUserId(userId: string) {
        // 1. Services via direct orders
        const orderServices = await this.prisma.order_Details.findMany({
            where: {
                order: {
                    user_id: userId,
                },
            },
            select: {
                service: {
                    include: {
                        service_tiers: {
                            where: { status: 1 },
                            orderBy: { price: 'asc' },
                        },
                        category: true,
                        service_features: {
                            include: { feature: true },
                        },
                        addons: {
                            where: { status: 1 },
                        }
                    }
                },
            },
        });

        // Flatten and deduplicate services
        const services = orderServices
            .map(od => od.service)
            .filter(Boolean);

        // Deduplicate by service id
        const uniqueServices = Array.from(
            new Map(services.map(s => [s.id, s])).values()
        );

        // Format the response (reuse your formatting logic)
        const formattedServices = uniqueServices.map((service) => ({
            id: service.id,
            name: service.name,
            description: service.description,
            category: service.category?.name ?? '—',
            category_id: service.category_id,
            price_range: service.service_tiers.length > 0
                ? {
                    min: Math.min(...service.service_tiers.map(tier => tier.price || 0)),
                    max: Math.max(...service.service_tiers.map(tier => tier.price || 0)),
                    currency: 'USD'
                }
                : null,
            starting_price: service.service_tiers[0]?.price
                ? `$${service.service_tiers[0].price.toFixed(2)}/mo`
                : 'N/A',
            features: service.service_features.map((sf) => sf.feature?.name).filter(Boolean),
            addons: service.addons.map(addon => ({
                id: addon.id,
                name: addon.name,
                description: addon.description,
                price: addon.price,
                max_count: addon.max_count
            })),
            tiers: service.service_tiers.map(tier => ({
                id: tier.id,
                name: tier.name,
                price: tier.price,
                max_post: tier.max_post
            })),
            created_at: service.created_at,
            updated_at: service.updated_at,
        }));

        return {
            success: true,
            data: formattedServices,
            total: formattedServices.length
        };
    }
}