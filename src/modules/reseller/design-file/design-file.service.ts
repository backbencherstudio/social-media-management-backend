import { Injectable } from '@nestjs/common';
import { CreateDesignFileDto } from './dto/create-design-file.dto';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class DesignFileService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createDesignFileDto: CreateDesignFileDto, files?: Express.Multer.File[]) {
    // Create DesignFile record
    const designFile = await this.prisma.designFile.create({
      data: {
        content: createDesignFileDto.content,
      },
    });

    // Handle file uploads
    if (files) {
      const fileAssets = [];
      for (const file of files) {
        // Generate random filename
        const randomName = Array(32)
          .fill(null)
          .map(() => Math.round(Math.random() * 16).toString(16))
          .join('');
        const fileName = `${randomName}-${file.originalname}`;

        fileAssets.push({
          designFileId: designFile.id,
          name: file.originalname,
          type: file.mimetype.startsWith('image') ? 'image' : 'video',
          file_path: fileName,
          size: file.size,
        });
      }
      if (fileAssets.length > 0) {
        await this.prisma.designFileAsset.createMany({ data: fileAssets });
      }
    }

    return this.findOne(designFile.id);
  }

  async findAll() {
    return this.prisma.designFile.findMany({
      include: { files: true },
      orderBy: { created_at: 'desc' },
    });
  }

  async findOne(id: string) {
    return this.prisma.designFile.findUnique({
      where: { id },
      include: { files: true },
    });
  }
}