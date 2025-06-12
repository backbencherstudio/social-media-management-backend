import { Injectable } from '@nestjs/common';
import { CreateDesignFileDto } from './dto/create-design-file.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class DesignFileService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createDesignFileDto: CreateDesignFileDto) {
    // Create DesignFile record
    const designFile = await this.prisma.designFile.create({
      data: {
        content: createDesignFileDto.content,
      },
    });

    // Process files from DTO (as plain metadata)
    if (createDesignFileDto.files && createDesignFileDto.files.length > 0) {
      const fileAssets = createDesignFileDto.files.map(file => ({
        designFileId: designFile.id,
        name: file.name,
        type: file.type,
        file_path: file.file_path,
        size: file.size,
      }));

      await this.prisma.designFileAsset.createMany({ data: fileAssets });
    }

    return {
      success: true,
      data: designFile,
    };
  }

  async findAll() {
    const designFiles = await this.prisma.designFile.findMany({
      include: { files: true },
      orderBy: { created_at: 'desc' },
    });

    return {
      success: true,
      data: designFiles,
    };
  }

  async findOne(id: string) {
    const designFile = await this.prisma.designFile.findUnique({
      where: { id },
      include: { files: true },
    });

    return {
      success: true,
      data: designFile,
    };
  }
}
