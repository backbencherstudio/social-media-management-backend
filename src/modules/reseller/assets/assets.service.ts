import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class AssetsService {
    constructor(private readonly prisma: PrismaService) { }

    // Helper to count by type in a table, filtered by user
    private async countByType(model: 'postFile' | 'designFileAsset' | 'attachment', userId: string, typeField = 'type') {
        let prismaModel;
        let where: any = {};
        switch (model) {
            case 'postFile':
                prismaModel = this.prisma.postFile;
                where = { post: { task: { user_id: userId } } };
                break;
            case 'designFileAsset':
                prismaModel = this.prisma.designFileAsset;
                where = { design_file: { task: { user_id: userId } } };
                break;
            case 'attachment':
                prismaModel = this.prisma.attachment;
                where = { messages: { some: { OR: [{ sender_id: userId }, { receiver_id: userId }] } } };
                break;
            default:
                throw new Error('Invalid model');
        }
        const [videos, images, others] = await Promise.all([
            prismaModel.count({ where: { ...where, [typeField]: { contains: 'video' } } }),
            prismaModel.count({ where: { ...where, [typeField]: { contains: 'image' } } }),
            prismaModel.count({
                where: {
                    ...where,
                    AND: [
                        { [typeField]: { not: { contains: 'video' } } },
                        { [typeField]: { not: { contains: 'image' } } },
                    ],
                },
            }),
        ]);
        return { videos, images, others };
    }

    async getStats(userId: string) {
        const postFileStats = await this.countByType('postFile', userId);
        const designFileStats = await this.countByType('designFileAsset', userId);
        const attachmentStats = await this.countByType('attachment', userId);
        // blogFile skipped (no user association)

        const videos = postFileStats.videos + designFileStats.videos + attachmentStats.videos;
        const images = postFileStats.images + designFileStats.images + attachmentStats.images;
        const others = postFileStats.others + designFileStats.others + attachmentStats.others;

        return { videos, images, others };
    }

    async getRecentFiles(userId: string, limit: number) {
        // Fetch recent post files
        const postFiles = await this.prisma.postFile.findMany({
            where: { post: { task: { user_id: userId } } },
            orderBy: { created_at: 'desc' },
            take: limit,
            select: {
                id: true,
                name: true,
                type: true,
                file_path: true,
                size: true,
                created_at: true,
                updated_at: true,
            },
        });

        // Fetch recent design file assets
        const designFiles = await this.prisma.designFileAsset.findMany({
            where: { design_file: { task: { user_id: userId } } },
            orderBy: { created_at: 'desc' },
            take: limit,
            select: {
                id: true,
                name: true,
                type: true,
                file_path: true,
                size: true,
                created_at: true,
                updated_at: true,
            },
        });

        // Fetch recent attachments (chat/message files)
        const attachments = await this.prisma.attachment.findMany({
            where: { messages: { some: { OR: [{ sender_id: userId }, { receiver_id: userId }] } } },
            orderBy: { created_at: 'desc' },
            take: limit,
            select: {
                id: true,
                name: true,
                type: true,
                file: true,
                size: true,
                created_at: true,
                updated_at: true,
            },
        });
        // Blog files skipped (no user association)

        // Normalize all file objects to a common structure
        const normalize = (file, source) => ({
            id: file.id,
            name: file.name,
            type: file.type,
            file_path: file.file_path || file.file || '',
            size: file.size,
            created_at: file.created_at,
            updated_at: file.updated_at,
            source,
        });

        const allFiles = [
            ...postFiles.map(f => normalize(f, 'post')),
            ...designFiles.map(f => normalize(f, 'design')),
            ...attachments.map(f => normalize(f, 'attachment')),
        ];

        allFiles.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        return allFiles.slice(0, limit);
    }

    async getFolders(userId: string) {
        // Images
        const postImageCount = await this.prisma.postFile.count({ where: { type: 'image', post: { task: { user_id: userId } } } });
        const designImageCount = await this.prisma.designFileAsset.count({ where: { type: 'image', design_file: { task: { user_id: userId } } } });
        const attachmentImageCount = await this.prisma.attachment.count({ where: { type: 'image', messages: { some: { OR: [{ sender_id: userId }, { receiver_id: userId }] } } } });
        const imageCount = postImageCount + designImageCount + attachmentImageCount;

        // Videos
        const postVideoCount = await this.prisma.postFile.count({ where: { type: 'video', post: { task: { user_id: userId } } } });
        const designVideoCount = await this.prisma.designFileAsset.count({ where: { type: 'video', design_file: { task: { user_id: userId } } } });
        const attachmentVideoCount = await this.prisma.attachment.count({ where: { type: 'video', messages: { some: { OR: [{ sender_id: userId }, { receiver_id: userId }] } } } });
        const videoCount = postVideoCount + designVideoCount + attachmentVideoCount;

        // Others
        const postOtherCount = await this.prisma.postFile.count({ where: { NOT: [{ type: 'image' }, { type: 'video' }], post: { task: { user_id: userId } } } });
        const designOtherCount = await this.prisma.designFileAsset.count({ where: { NOT: [{ type: 'image' }, { type: 'video' }], design_file: { task: { user_id: userId } } } });
        const attachmentOtherCount = await this.prisma.attachment.count({ where: { NOT: [{ type: 'image' }, { type: 'video' }], messages: { some: { OR: [{ sender_id: userId }, { receiver_id: userId }] } } } });
        const otherCount = postOtherCount + designOtherCount + attachmentOtherCount;

        return [
            { name: 'Images', type: 'image', count: imageCount },
            { name: 'Videos', type: 'video', count: videoCount },
            { name: 'Others', type: 'other', count: otherCount },
        ];
    }

    async getFilesByType(userId: string, folderType: 'image' | 'video' | 'other') {
        let postWhere: any = { post: { task: { user_id: userId } } };
        let designWhere: any = { design_file: { task: { user_id: userId } } };
        let attachmentWhere: any = { messages: { some: { OR: [{ sender_id: userId }, { receiver_id: userId }] } } };

        if (folderType === 'image' || folderType === 'video') {
            postWhere.type = folderType;
            designWhere.type = folderType;
            attachmentWhere.type = folderType;
        } else if (folderType === 'other') {
            postWhere.NOT = [{ type: 'image' }, { type: 'video' }];
            designWhere.NOT = [{ type: 'image' }, { type: 'video' }];
            attachmentWhere.NOT = [{ type: 'image' }, { type: 'video' }];
        }

        const [postFiles, designFiles, attachments] = await Promise.all([
            this.prisma.postFile.findMany({
                where: postWhere,
                select: { id: true, name: true, type: true, file_path: true, size: true, file_alt: true }
            }),
            this.prisma.designFileAsset.findMany({
                where: designWhere,
                select: { id: true, name: true, type: true, file_path: true, size: true }
            }),
            this.prisma.attachment.findMany({
                where: attachmentWhere,
                select: { id: true, name: true, type: true, file: true, size: true }
            }),
        ]);

        // Normalize all to a common format
        const files = [
            ...postFiles.map(f => ({ ...f, source: 'postFile', url: f.file_path })),
            ...designFiles.map(f => ({ ...f, source: 'designFileAsset', url: f.file_path })),
            ...attachments.map(f => ({ ...f, source: 'attachment', url: f.file })),
        ];

        return files;
    }
} 