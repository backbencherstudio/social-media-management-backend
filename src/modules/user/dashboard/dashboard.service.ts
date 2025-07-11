import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { SubscriptionStatus } from '@prisma/client';

@Injectable()
export class DashboardService {
    constructor(private readonly prisma: PrismaService) { }

    async getActiveServices(userId: string) {
        const activeServices = await this.prisma.subscription.findMany({
            where: {
                user_id: userId,
                status: SubscriptionStatus.active,
            },
            include: {
                order: {
                    select: {
                        id: true,
                        pakage_name: true,
                        Order_Details: {
                            select: {
                                id: true,
                                service_name: true,
                                service_amount_name: true,
                                service_count: true,
                                service_price: true,
                                service_tier_id: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                created_at: 'desc',
            },
        });

        return {
            total: activeServices.length,
            data: activeServices.map((subscription) => ({
                id: subscription.id,
                service: subscription.order.Order_Details?.[0]?.service_name || 'Unknown Service',
                started: subscription.created_at,
                status: subscription.status,
                nextPayment: subscription.end_at,
            })),
        };
    }

    async getAllServices(userId: string) {
        const activeServices = await this.prisma.subscription.findMany({
            where: {
                user_id: userId,
                // status: SubscriptionStatus.active,
            },
            include: {
                order: {
                    select: {
                        id: true,
                        pakage_name: true,
                        order_status: true,
                        Order_Details: {
                            select: {
                                id: true,
                                service_name: true,
                                service_amount_name: true,
                                service_count: true,
                                service_price: true,
                                service_tier_id: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                created_at: 'desc',
            },
        });

        return {
            total: activeServices.length,
            data: activeServices.map((subscription) => ({
                id: subscription.id,
                order_id: subscription.order_id,
                service: subscription.order.Order_Details?.[0]?.service_name || 'Unknown Service',
                started: subscription.created_at,
                order_status: subscription.order.order_status,
                status: subscription.status,
                nextPayment: subscription.end_at,
            })),
        };
    }

    async getRecentActivity(userId: string) {
        const recentPosts = await this.prisma.post.findMany({
            where: {
                status: 1, // Published posts
                task: {
                    user_id: userId
                },
                post_channels: {
                    some: {
                        channel: {
                            name: 'Twitter'
                        }
                    }
                }
            },
            include: {
                post_channels: {
                    include: {
                        channel: true
                    }
                }
            },
            orderBy: {
                created_at: 'desc'
            },
            take: 5
        });

        return recentPosts.map(post => ({
            id: post.id,
            type: 'post',
            platform: 'Twitter',
            action: 'published',
            createdAt: post.created_at,
            timeAgo: this.getTimeAgo(post.created_at)
        }));
    }

    private getTimeAgo(date: Date): string {
        const now = new Date();
        const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

        if (diffInMinutes < 60) {
            return `${diffInMinutes} minutes ago`;
        }

        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) {
            return `${diffInHours} hours ago`;
        }

        const diffInDays = Math.floor(diffInHours / 24);
        return `${diffInDays} days ago`;
    }

    async getOfferedServices() {
        // Get all services and their lowest tier price
        const services = await this.prisma.service.findMany({
            where: { status: 1 },
            include: {
                service_tiers: {
                    orderBy: { price: 'asc' },
                    take: 1
                }
            },
            orderBy: { created_at: 'asc' }
        });

        // Optionally, you can hardcode tags/icons here or add them to the DB
        const tags: Record<string, string | undefined> = {
            'Social Media Posts': 'BEST SELLER',
            'Blog Post': 'New',
        };

        return services.map(service => ({
            id: service.id,
            name: service.name,
            description: service.description,
            price: service.service_tiers[0]?.price ? `Starts from $${service.service_tiers[0].price}/mo` : undefined,
            tag: tags[service.name || ''] || undefined,
            // icon: ... (frontend can map icon by name)
            // learnMore: ... (frontend can generate link)
        }));
    }
}
