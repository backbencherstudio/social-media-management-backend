import { Injectable } from '@nestjs/common';
import { CreateDesignFileDto } from './dto/create-design-file.dto';
import { SojebStorage } from 'src/common/lib/Disk/SojebStorage';
import appConfig from 'src/config/app.config';
import { PrismaService } from 'src/prisma/prisma.service';
import { NotificationRepository } from 'src/common/repository/notification/notification.repository';
import { MessageGateway } from 'src/modules/chat/message/message.gateway';

@Injectable()
export class DesignFileService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly messageGateway: MessageGateway,
  ) { }

  async create(
    createDesignFileDto: CreateDesignFileDto,
    assets?: Express.Multer.File[],
  ) {
    try {
      // Validate task_id if provided
      if (createDesignFileDto.task_id) {
        const taskExists = await this.prisma.taskAssign.findUnique({
          where: { id: createDesignFileDto.task_id },
        });

        if (!taskExists) {
          return {
            success: false,
            message: `Task with ID ${createDesignFileDto.task_id} does not exist`
          };
        }
      }
      // Create DesignFile record
      const designFile = await this.prisma.designFile.create({
        data: {
          content: createDesignFileDto.content,
          status: createDesignFileDto.status || 0,
          task_id: createDesignFileDto.task_id
        },
      });

      // Handle file uploads
      if (assets && assets.length > 0) {
        const fileAssets = [];

        for (const file of assets) {
          // Generate random filename
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');

          const fileName = `${randomName}${file.originalname}`;
          // Upload file using SojebStorage
          await SojebStorage.put(appConfig().storageUrl.assets + '/' + fileName, file.buffer);

          fileAssets.push({
            design_file_id: designFile.id,
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

      if (createDesignFileDto.task_id) {
        await this.prisma.taskAssign.update({
          where: { id: createDesignFileDto.task_id },
          data: { status: 'Clint_review' },
        });
        // Send notification to assigned user
        const task = await this.prisma.taskAssign.findUnique({
          where: { id: createDesignFileDto.task_id },
          include: { user: true },
        });
        if (task) {
          const reseller = await this.prisma.reseller.findUnique({
            where: { reseller_id: task.reseller_id },
          });
          const notificationPayload = {
            sender_id: reseller?.user_id,
            receiver_id: task.user_id,
            text: 'A new design file has been created.',
            type: 'post' as const,
            entity_id: designFile.id,
          };
          await NotificationRepository.createNotification(notificationPayload);
          this.messageGateway.server.emit('notification', notificationPayload);
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
      const designassets = await this.prisma.designFile.findMany({
        include: { assets: true },
        orderBy: { created_at: 'desc' },
      });
      // Add public URLs to assets
      const designassetsWithUrls = designassets.map((designFile) => ({
        ...designFile,
        assets: designFile.assets.map((file) => ({
          ...file,
          file_url: SojebStorage.url(
            appConfig().storageUrl.assets + '/' + file.file_path,
          ),
        })),
      }));

      return {
        success: true,
        data: designassetsWithUrls,
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
        include: { assets: true },
      });

      if (!designFile) {
        return {
          success: false,
          message: 'Design file not found',
        };
      }

      // Add public URLs to assets
      const designFileWithUrls = {
        ...designFile,
        assets: designFile.assets.map((file) => ({
          ...file,
          file_url: SojebStorage.url(
            appConfig().storageUrl.assets + '/' + file.file_path,
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
      // Update the design file
      const post = await this.prisma.designFile.update({
        where: { id: designFileId },
        data: {
          status: action,
          feedback: feedback || null,
        },
      });

      // Fetch the related task and its design files
      if (post.task_id) {
        const task = await this.prisma.taskAssign.findUnique({
          where: { id: post.task_id },
          include: { files: true }, // 'files' is the relation to DesignFile[]
        });

        if (task) {
          const approvedCount = task.files.filter(f => f.status === 1).length;
          const requiredCount = task.post_count || task.files.length; // adjust as needed

          if (approvedCount >= requiredCount) {
            await this.prisma.taskAssign.update({
              where: { id: task.id },
              data: { status: 'completed' },
            });
          }
        }
      }

      return {
        success: true,
        message: `File updated successfully`,
        data: post,
      };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }



  async update(id: string, updateDesignFileDto: any, assets?: Express.Multer.File[]) {
    try {
      // Get existing design file with assets
      const existingDesignFile = await this.prisma.designFile.findUnique({
        where: { id },
        include: { assets: true },
      });

      if (!existingDesignFile) {
        return { success: false, message: 'Design file not found' };
      }

      // Handle new file uploads
      if (assets && assets.length > 0) {
        const newFileAssets = [];

        for (const file of assets) {
          // Generate random filename
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');

          const fileName = `${randomName}${file.originalname}`;

          // Upload file using SojebStorage
          await SojebStorage.put(appConfig().storageUrl.assets + '/' + fileName, file.buffer);

          newFileAssets.push({
            design_file_id: id,
            name: file.originalname,
            type: file.mimetype.startsWith('image') ? 'image' : 'video',
            file_path: fileName,
            size: file.size,
          });
        }

        if (newFileAssets.length > 0) {
          await this.prisma.designFileAsset.createMany({ data: newFileAssets });
        }
      }

      // Update the design file
      const updatedDesignFile = await this.prisma.designFile.update({
        where: { id },
        data: {
          content: updateDesignFileDto.content,
          status: updateDesignFileDto.status,
          feedback: updateDesignFileDto.feedback,
        },
        include: { assets: true },
      });

      // Add public URLs to assets
      const designFileWithUrls = {
        ...updatedDesignFile,
        assets: updatedDesignFile.assets.map((file) => ({
          ...file,
          file_url: SojebStorage.url(
            appConfig().storageUrl.assets + '/' + file.file_path,
          ),
        })),
      };

      return { success: true, data: designFileWithUrls };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  async remove(id: string) {
    try {
      // Get the design file with all assets
      const designFile = await this.prisma.designFile.findUnique({
        where: { id },
        include: { assets: true },
      });

      if (!designFile) {
        return { success: false, message: 'Design file not found' };
      }

      // Delete files from storage
      for (const asset of designFile.assets) {
        try {
          await SojebStorage.delete('assets/' + asset.file_path);
        } catch (error) {
          console.warn(`Failed to delete file ${asset.file_path}:`, error);
        }
      }

      // Delete all connected records in a transaction
      await this.prisma.$transaction(async (tx) => {
        // Delete design file assets
        await tx.designFileAsset.deleteMany({
          where: { design_file_id: id },
        });

        // Finally delete the design file
        await tx.designFile.delete({
          where: { id },
        });
      });

      return { success: true, message: 'Design file and all connected records deleted successfully' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
}
