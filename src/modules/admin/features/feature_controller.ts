import {
  Body,
  Controller,
  Post,
  Req,
  Get,
  Put,
  Delete,
  Param,
} from '@nestjs/common';
import { FeatureServices } from './feature_service';
import { CreateFeatureDto } from './dto/create-feature-dto';
import { UpdateFeatureDto } from './dto/update-feature-dto';
import { ApiParam, ApiOperation, ApiResponse } from '@nestjs/swagger';

@Controller('features')
export class FeatureController {
  constructor(private readonly featureService: FeatureServices) {}

  // Create a new feature
@Post()
@ApiOperation({ summary: 'Create a new feature' })
@ApiResponse({
    status: 201,
    description: 'Feature created successfully',
    schema: {
      example: {
        success: true,
        message: 'Feature created successfully',
        feature_id: 'cm9s1ilfo0000refk32zy5vus',
      },
    },
  })
  async create(@Body()
createFeatureDto: CreateFeatureDto, p0: any) {
    return await this.featureService.create(createFeatureDto);
  }

  //  Get all features
@Get()
@ApiOperation({ summary: 'Get all features' })
@ApiResponse({
  status: 200,
  description: 'List of all features',
  schema: {
    example: {
      success: true,
      message: 'Features fetched successfully',
      data: [
        {
          id: 'cm9s1ilfo0000refk32zy5vus',
          name: 'feat7',
          status: 1,
          created_at: '2025-04-26T10:00:00.000Z',
          updated_at: '2025-04-26T10:00:00.000Z',
        },
        {
          id: 'cm9s1ilfo0001refk32zy5xxy',
          name: 'feat8',
          status: 0,
          created_at: '2025-04-26T10:10:00.000Z',
          updated_at: '2025-04-26T10:15:00.000Z',
        }
      ]
    }
  }
})
@ApiResponse({
  status: 200,
  description: 'No features found',
  schema: {
    example: {
      message: 'No features available'
    }
  }
})
async findAll() {
    return await this.featureService.findAll();
  }

  //  Get a single feature by ID
@Get(':id')
@ApiOperation({ summary: 'Get a single feature by ID' })
@ApiParam({ name: 'id', description: 'Feature ID' })
@ApiResponse({
  status: 200,
  description: 'Feature fetched successfully',
  schema: {
    example: {
      success: true,
      message: 'Feature fetched successfully',
      data: {
        id: 'cm9s1ilfo0000refk32zy5vus',
        name: 'feat7',
        status: 1,
        created_at: '2025-04-26T10:00:00.000Z',
        updated_at: '2025-04-26T10:00:00.000Z',
      }
    }
  }
})
@ApiResponse({
  status: 404,
  description: 'Feature not found',
  schema: {
    example: {
      success: false,
      message: {
        message: 'Feature with ID cm9s1ilfo0000refk32zy5vus not found',
        error: 'Not Found',
        statusCode: 404
      }
    }
  }
})
async findOne(@Param('id') id: string) {
    return await this.featureService.findOne(id);
  }

  //  Update a feature by ID
@Put(':id')
@ApiOperation({ summary: 'Update a feature by ID' })
@ApiParam({ name: 'id', description: 'ID of the feature to update' })
@ApiResponse({
  status: 200,
  description: 'Feature updated successfully',
  schema: {
    example: {
      success: true,
      message: 'Feature updated successfully',
      data: {
        id: 'cm9s1ilfo0000refk32zy5vus',
        name: 'Updated Feature Name',
        status: 0,
        updated_at: '2025-04-26T12:30:00.000Z'
      }
    }
  }
})
@ApiResponse({
  status: 404,
  description: 'Feature not found',
  schema: {
    example: {
      success: false,
      message: {
        message: 'Feature with ID cm9s1ilfo0000refk32zy5vus not found',
        error: 'Not Found',
        statusCode: 404
      }
    }
  }
})
async update(@Param('id') id: string, @Body() updateFeatureDto: UpdateFeatureDto) {
    return await this.featureService.update(id, updateFeatureDto);
  }

  //  Delete a feature by ID
@Delete(':id')
@ApiOperation({ summary: 'Delete a feature by ID (soft delete or permanent)' })
@ApiParam({ name: 'id', description: 'The ID of the feature to delete' })
@ApiResponse({
  status: 200,
  description: 'Feature deleted successfully',
  schema: {
    example: {
      success: true,
      message: 'Feature deleted successfully',
      data: {
        id: 'cm9s1ilfo0000refk32zy5vus'
      }
    }
  }
})
@ApiResponse({
  status: 404,
  description: 'Feature not found',
  schema: {
    example: {
      success: false,
      message: {
        message: 'Feature with ID cm9s1ilfo0000refk32zy5vus not found',
        error: 'Not Found',
        statusCode: 404
      }
    }
  }
})
  async remove(@Param('id') id: string) {
    return await this.featureService.remove(id);
  }
}
