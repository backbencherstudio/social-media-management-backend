import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class AssetsService {
    constructor(private readonly prisma: PrismaService) { }

    // Get all design files for the user
    async getDesignFiles(userId: string) {
        const files = await this.prisma.designFileAsset.findMany({
            where: {
                design_file: {
                    task: {
                        user_id: userId,
                    },
                },
            },
            include: {
                design_file: true,
            },
            orderBy: { created_at: 'desc' },
        });
        return { success: true, data: files };
    }

    // Review (approve/reject) a design file
    async reviewDesignFile(
        userId: string,
        designFileId: string,
        status: 1 | 2, // 1 = approved, 2 = rejected
        feedback?: string,
    ) {
        // Ensure the design file belongs to the user
        const designFile = await this.prisma.designFile.findFirst({
            where: {
                id: designFileId,
                task: { user_id: userId },
            },
        });
        if (!designFile) {
            return { success: false, message: 'Design file not found or not allowed' };
        }

        // Update the design file's status and feedback
        const updated = await this.prisma.designFile.update({
            where: { id: designFileId },
            data: {
                status,
                feedback: feedback || null,
            },
        });

        return { success: true, data: updated };
    }
}
