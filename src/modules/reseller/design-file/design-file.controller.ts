import {
  Controller, Post, Body, Get, Param, UseInterceptors, UploadedFiles, Req
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { DesignFileService } from './design-file.service';
import { CreateDesignFileDto } from './dto/create-design-file.dto';
import { Request } from 'express';

@Controller('design-file')
export class DesignFileController {
  constructor(private readonly designFileService: DesignFileService) {}

  @Post()
  @UseInterceptors(
    FileFieldsInterceptor(
      [{ name: 'files', maxCount: 10 }],
      { storage: memoryStorage() }
    )
  )
  async create(
    @Req() req: Request,
    @UploadedFiles() files: { files?: Express.Multer.File[] }
  ) {
    // Parse the JSON string from req.body.data
    let createDesignFileDto: CreateDesignFileDto;
    
    if (req.body.data) {
      try {
        createDesignFileDto = JSON.parse(req.body.data);
      } catch (error) {
        return {
          success: false,
          message: 'Invalid JSON data format'
        };
      }
    } else {
      // Fallback to direct body if no data field
      createDesignFileDto = req.body as CreateDesignFileDto;
    }

    return this.designFileService.create(createDesignFileDto, files?.files);
  }

  @Get()
  findAll() {
    return this.designFileService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.designFileService.findOne(id);
  }
}