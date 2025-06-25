import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class AssetsService {
    constructor(private readonly prisma: PrismaService) { }

    // Get all design files for the user
    async getDesignFiles(userId: string) {
        const files = await this.prisma.designFileAsset.findMany({
            where: {
                design_file: {
                    task: {
                        user_id: userId,
                    },
                },
            },
            include: {
                design_file: true,
            },
            orderBy: { created_at: 'desc' },
        });
        return { success: true, data: files };
    }

    async getContentQueue(userId: string, status?: string, date?: string) {
        // --- Fetch posts ---
        const postWhere: any = {
            task: { user_id: userId },
        };
        if (status) {
            if (status === 'pending') postWhere.status = 0;
            if (status === 'approve') postWhere.status = 1;
        }
        if (date) {
            postWhere.schedule_at = { equals: new Date(date) };
        }

        const posts = await this.prisma.post.findMany({
            where: postWhere,
            include: {
                post_files: true,
                post_channels: { include: { channel: true } },
                task: true,
            },
            orderBy: { schedule_at: 'asc' },
        });

        // --- Fetch design files ---
        const designFiles = await this.prisma.designFileAsset.findMany({
            where: {
                design_file: {
                    task: { user_id: userId },
                    ...(status ? { status: status === 'pending' ? 0 : 1 } : {}),
                },
            },
            include: {
                design_file: true,
            },
            orderBy: { created_at: 'desc' },
        });

        // --- Normalize posts ---
        const postItems = posts.map(post => ({
            id: post.id,
            type: 'post',
            title: post.content?.slice(0, 50) || 'Untitled',
            scheduledFor: post.schedule_at,
            platforms: post.post_channels.map(pc => pc.channel?.name).filter(Boolean),
            status: post.status,
            preview: post.content,
            files: post.post_files,
            postType: post.task?.post_type,
            submittedAt: post.created_at,
        }));

        // --- Normalize design files ---
        const designFileItems = designFiles.map(file => ({
            id: file.id,
            type: 'design_file',
            title: file.name,
            scheduledFor: file.created_at,
            platforms: [],
            status: file.design_file?.status,
            preview: null,
            files: [file],
            postType: 'Design File',
            submittedAt: file.created_at,
        }));

        // --- Combine and sort ---
        const queue = [...postItems, ...designFileItems].sort(
            (a, b) => new Date(b.scheduledFor).getTime() - new Date(a.scheduledFor).getTime()
        );

        return {
            success: true,
            date: queue
        };
    }
}
