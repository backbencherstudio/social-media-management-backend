import { Controller, Get, Query } from '@nestjs/common';
import { AssetsService } from './assets.service';

@Controller('assets')
export class AssetsController {
    constructor(private readonly assetsService: AssetsService) { }

    @Get('stats')
    getStats() {
        return this.assetsService.getStats();
    }

    @Get('recent')
    getRecent(@Query('limit') limit: number) {
        return this.assetsService.getRecentFiles(Number(limit) || 10);
    }

    @Get('folders')
    getFolders() {
        return this.assetsService.getFolders();
    }

    @Get()
    searchAssets(@Query() query) {
        return this.assetsService.searchAssets(query);
    }
} 