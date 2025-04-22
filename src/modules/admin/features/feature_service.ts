import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateFeatureDto } from './dto/create-feature-dto';
import { UpdateFeatureDto } from './dto/update-feature-dto';

@Injectable()
export class FeatureServices {
  constructor(private readonly Prisma: PrismaService) {}

  // ✅ Create a new feature
  async create(createFeatureDto: CreateFeatureDto) {
    try {
      const feature = await this.Prisma.feature.create({
        data: createFeatureDto,
      });

      return {
        success: true,
        message: 'Feature created successfully',
        feature_id: feature.id,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  // ✅ Get all features
  async findAll() {
    try {
      const features = await this.Prisma.feature.findMany();
      return features;
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  // ✅ Get a specific feature by ID
  async findOne(id: string) {
    try {
      const feature = await this.Prisma.feature.findUnique({ where: { id } });
      return feature;
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  // ✅ Remove (fetch?) feature by ID — looks like this should be a delete, fixed it.
  async remove(id: string) {
    try {
      const deleted = await this.Prisma.feature.delete({ where: { id } });
      return {
        success: true,
        message: 'Feature deleted successfully',
        feature_id: deleted.id,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  // ✅ Update a feature by ID
  async update(id: string, updateFeatureDto: UpdateFeatureDto) {
    try {
      const updatedFeature = await this.Prisma.feature.update({
        where: { id },
        data: updateFeatureDto,
      });

      return {
        success: true,
        message: 'Feature updated successfully',
        feature_id: updatedFeature.id,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }
}
