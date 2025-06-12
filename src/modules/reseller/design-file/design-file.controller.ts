import {
  Controller, Post, Body, Get, Param, UseInterceptors, UploadedFiles
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { DesignFileService } from './design-file.service';
import { CreateDesignFileDto } from './dto/create-design-file.dto';

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
  create(
    @Body() createDesignFileDto: CreateDesignFileDto,
    @UploadedFiles() files: { files?: Express.Multer.File[] }
  ) {
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
