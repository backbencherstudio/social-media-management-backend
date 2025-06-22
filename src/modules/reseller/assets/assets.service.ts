import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class AssetsService {
    constructor(private readonly prisma: PrismaService) { }

    // Helper to count by type in a table
    private async countByType(model: 'postFile' | 'designFileAsset' | 'attachment' | 'blogFile', typeField = 'type') {
        let prismaModel;
        switch (model) {
            case 'blogFile': prismaModel = this.prisma.blogFile; break;
            case 'postFile': prismaModel = this.prisma.postFile; break;
            case 'designFileAsset': prismaModel = this.prisma.designFileAsset; break;
            case 'attachment': prismaModel = this.prisma.attachment; break;
            default: throw new Error('Invalid model');
        }
        const [videos, images, others] = await Promise.all([
            prismaModel.count({ where: { [typeField]: { contains: 'video' } } }),
            prismaModel.count({ where: { [typeField]: { contains: 'image' } } }),
            prismaModel.count({
                where: {
                    AND: [
                        { [typeField]: { not: { contains: 'video' } } },
                        { [typeField]: { not: { contains: 'image' } } },
                    ],
                },
            }),
        ]);
        return { videos, images, others };
    }

    async getStats() {
        const blogFileStats = await this.countByType('blogFile');
        const postFileStats = await this.countByType('postFile');
        const designFileStats = await this.countByType('designFileAsset');
        const attachmentStats = await this.countByType('attachment');

        const videos = postFileStats.videos + designFileStats.videos + attachmentStats.videos + blogFileStats.videos;
        const images = postFileStats.images + designFileStats.images + attachmentStats.images + blogFileStats.images;
        const others = postFileStats.others + designFileStats.others + attachmentStats.others + blogFileStats.others;

        return { videos, images, others };
    }

    async getRecentFiles(limit: number) {
        // Fetch recent post files
        const postFiles = await this.prisma.postFile.findMany({
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
        // Fetch recent blog files
        const blogFiles = await this.prisma.blogFile.findMany({
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
            ...blogFiles.map(f => normalize(f, 'blog')),
            ...postFiles.map(f => normalize(f, 'post')),
            ...designFiles.map(f => normalize(f, 'design')),
            ...attachments.map(f => normalize(f, 'attachment')),
        ];

        allFiles.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        return allFiles.slice(0, limit);
    }

    async getFolders() {
        // Count files by type for each source
        const postCount = await this.prisma.postFile.count();
        const designCount = await this.prisma.designFileAsset.count();
        const attachmentCount = await this.prisma.attachment.count();
        const blogCount = await this.prisma.blogFile.count();
        console.log(blogCount)
        return [
            { name: 'Posts', type: 'post', count: postCount },
            { name: 'Designs', type: 'design', count: designCount },
            { name: 'Attachments', type: 'attachment', count: attachmentCount },
            { name: 'Blogs', type: 'blog', count: blogCount },
        ];
    }

    async searchAssets(query: any) {
        // Search across all sources by name/type
        const { type, name, source } = query;

        // Helper for search
        const searchWhere = (typeField, nameField) => ({
            ...(type ? { [typeField]: { contains: type } } : {}),
            ...(name ? { [nameField]: { contains: name } } : {}),
        });

        let results: any[] = [];

        if (!source || source === 'post') {
            const postFiles = await this.prisma.postFile.findMany({
                where: searchWhere('type', 'name'),
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
            results.push(...postFiles.map(f => ({ ...f, file_path: f.file_path, source: 'post' })));
        }
        if (!source || source === 'design') {
            const designFiles = await this.prisma.designFileAsset.findMany({
                where: searchWhere('type', 'name'),
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
            results.push(...designFiles.map(f => ({ ...f, file_path: f.file_path, source: 'design' })));
        }
        if (!source || source === 'attachment') {
            const attachments = await this.prisma.attachment.findMany({
                where: searchWhere('type', 'name'),
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
            results.push(...attachments.map(f => ({
                ...f,
                file_path: f.file || '',
                source: 'attachment'
            })));
        }
        if (!source || source === 'blog') {
            const blogFiles = await this.prisma.blogFile.findMany({
                where: searchWhere('type', 'name'),
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
            results.push(...blogFiles.map(f => ({ ...f, file_path: f.file_path, source: 'blog' })));
        }

        // Optionally sort by created_at
        results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        return results;
    }
} 