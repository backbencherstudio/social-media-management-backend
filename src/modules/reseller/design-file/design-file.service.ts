import { Injectable } from '@nestjs/common';
import { CreateDesignFileDto } from './dto/create-design-file.dto';
import { SojebStorage } from 'src/common/lib/Disk/SojebStorage';
import appConfig from 'src/config/app.config';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class DesignFileService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    createDesignFileDto: CreateDesignFileDto,
    files?: Express.Multer.File[],
  ) {
    console.log('Creating design file with data:', createDesignFileDto);
    console.log('Files:', files);
    try {
      // Create DesignFile record
      const designFile = await this.prisma.designFile.create({
        data: {
          content: createDesignFileDto.content,
          status: createDesignFileDto.status || 0,
        },
      });

      // Handle file uploads
      if (files && files.length > 0) {
        const fileAssets = [];

        for (const file of files) {
          // Generate random filename
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');

          const fileName = `${randomName}${file.originalname}`;
          console.log(`Uploading file: ${fileName} (${file.size} bytes)`);
          // Upload file using SojebStorage
          await SojebStorage.put('design-files/' + fileName, file.buffer);

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

      return {
        success: true,
        data: await this.findOne(designFile.id),
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  async findAll() {
   
    try {
      const designFiles = await this.prisma.designFile.findMany({
        include: { files: true },
        orderBy: { created_at: 'desc' },
      });
      console.log('designFiles', designFiles);
      // Add public URLs to files
      const designFilesWithUrls = designFiles.map((designFile) => ({
        ...designFile,
        files: designFile.files.map((file) => ({
          ...file,
          file_url: SojebStorage.url(
            appConfig().storageUrl.rootUrl + '/design-files/' + file.file_path,
          ),
        })),
      }));

      return {
        success: true,
        data: designFilesWithUrls,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  async findOne(id: string) {
    try {
      const designFile = await this.prisma.designFile.findUnique({
        where: { id },
        include: { files: true },
      });

      if (!designFile) {
        return {
          success: false,
          message: 'Design file not found',
        };
      }

      // Add public URLs to files
      const designFileWithUrls = {
        ...designFile,
        files: designFile.files.map((file) => ({
          ...file,
          file_url: SojebStorage.url(
            appConfig().storageUrl.rootUrl + '/design-files/' + file.file_path,
          ),
        })),
      };

      return {
        success: true,
        data: designFileWithUrls,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  async reviewDesignFile(
    designFileId: string,
    action: 1 | 2, // 1 for approve, 2 for reject
    feedback?: string,
  ) {
    try {
      const post = await this.prisma.designFile.update({
        where: { id: designFileId },
        data: {
          status: action,
          feedback: feedback || null,
        },
      });

      return {
        success: true,
        message: `File update successfully`,
        data: post,
      };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  async approveFile() {
   
    try {
      const designFiles = await this.prisma.designFile.findMany({
        where:{
          status:1
        },
        include: { files: true },
        orderBy: { created_at: 'desc' },
      });
     
      // Add public URLs to files
      const designFilesWithUrls = designFiles.map((designFile) => ({
        ...designFile,
        files: designFile.files.map((file) => ({
          ...file,
          file_url: SojebStorage.url(
            appConfig().storageUrl.rootUrl + '/design-files/' + file.file_path,
          ),
        })),
      }));

      return {
        success: true,
        data: designFilesWithUrls,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }
}
