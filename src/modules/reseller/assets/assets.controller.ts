import { Controller, Get, Query, Param } from '@nestjs/common';
import { AssetsService } from './assets.service';

@Controller('assets')
export class AssetsController {
    constructor(private readonly assetsService: AssetsService) { }

    @Get('/stats/:userId')
    getStats(@Param('userId') userId: string) {
        return this.assetsService.getStats(userId);
    }

    @Get('/recent/:userId')
    getRecent(@Param('userId') userId: string, @Query('limit') limit: number) {
        return this.assetsService.getRecentFiles(userId, Number(limit) || 10);
    }

    @Get('/folders/:userId')
    async getFolders(@Param('userId') userId: string) {
        return await this.assetsService.getFolders(userId);
    }

    @Get('/files/:type/:userId')
    async getFilesByType(
        @Param('userId') userId: string,
        @Param('type') type: 'image' | 'video' | 'other'
    ) {
        if (!['image', 'video', 'other'].includes(type)) {
            return { success: false, message: 'Invalid folder type' };
        }
        const files = await this.assetsService.getFilesByType(userId, type);
        return { success: true, data: files };
    }
} 