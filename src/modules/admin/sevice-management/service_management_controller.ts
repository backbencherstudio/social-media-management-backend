import {
  Body,
  Controller,
  Post,
  Req,
  Get,
  Put,
  Delete,
  Param,
  Patch
} from '@nestjs/common';
import { ServiceManagementService } from './service-management.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';

@Controller('services')
export class ServiceManagementController {
  constructor(
    private readonly serviceManagementService: ServiceManagementService,
  ) {}

@Post()
@ApiOperation({ summary: 'Create a new service' })
@ApiResponse({
    status: 201,
    description: 'Service created successfully',
    schema: {
      example: {
        success: true,
        message: 'Service created successfully',
        service_id: 'cm9wdxupu0001re44d5777p20',
      },
    },
  })
async create(@Body() dto: CreateServiceDto, @Req() req: any) {
    const userId = req.user?.id; // adjust to your auth logic
    return await this.serviceManagementService.createService(dto, userId);
  }


@Get('allServices')
@ApiOperation({ summary: 'Get all active services' })
@ApiResponse({
  status: 200,
  description: 'List of all active services',
  schema: {
    example: {
      success: true,
      message: 'Services fetched successfully',
      data: [
        {
          id: 'cm9wdxupu0001re44d5777p20',
          name: 'My Service 555589aaaaaaaaa',
          description: 'Grow fast online',
          category_id: 'clu1e9x0e0001tx08bd8y91gc',
          features: ['feat1', 'feat3', 'feat4'],
          tiers: [
            { max_post: 10, price: 99 },
            { max_post: 20, price: 149 }
          ],
          primary_platform: 'Instagram',
          extra_platforms: ['Twitter', 'LinkedIn'],
          extra_platformPrice: 10,
          created_at: '2025-04-26T06:00:00.000Z',
          updated_at: '2025-04-26T06:00:00.000Z',
          deleted_at: null,
          status: 1
        }
      ]
    }
  }
})
async getAllActiveServices() {
    return await this.serviceManagementService.getAllServices();
  }

  
@Patch(':id/toggle-status')
@ApiOperation({ summary: 'Toggle service status (active/inactive)' })
@ApiParam({ name: 'id', description: 'Service ID to toggle status' })
@ApiResponse({
  status: 200,
  description: 'Service status toggled successfully',
  schema: {
    example: {
      success: true,
      message: 'Service status updated',
      data: {
        id: 'cm9wdxupu0001re44d5777p20',
        status: 0 // or 1 depending on toggle
      }
    }
  }
})
@ApiResponse({
  status: 404,
  description: 'Service not found',
  schema: {
    example: {
      success: false,
      message: {
        message: 'Service with ID cm9wdxupu0001re44d5777p20 not found',
        error: 'Not Found',
        statusCode: 404
      }
    }
  }
})
async toggleServiceStatus(@Param('id') id: string) {
    return await this.serviceManagementService.toggleServiceStatus(id);
}


@Get('inactive')
@ApiOperation({ summary: 'Get all inactive services (short overview)' })
@ApiResponse({
  status: 200,
  description: 'Inactive services list',
  schema: {
    example: [
      {
        id: 'cm9rxm70c0001reesizie46h3',
        name: 'My Service',
        category: '—',
        price: '$49.00/mo',
        status: 'Inactive',
        features: ['feat1', 'feat2']
      }
    ]
  }
})
@ApiResponse({
  status: 200,
  description: 'No inactive services found',
  schema: {
    example: {
      message: 'No inactive services currently'
    }
  }
})
async getInactiveServices() {
    return await this.serviceManagementService.getServicesByStatus(0); // 0 = inactive
  }

@Get('active')
@ApiOperation({ summary: 'Get all active services (short overview)' })
@ApiResponse({
  status: 200,
  description: 'Active services list',
  schema: {
    example: [
      {
        id: 'cm9rxm70c0001reesizie46h3',
        name: 'My Service',
        category: '—',
        price: '$99.00/mo',
        status: 'Active',
        features: ['feat4', 'feat1', 'feat3']
      }
    ]
  }
})
@ApiResponse({
  status: 200,
  description: 'No active services found',
  schema: {
    example: {
      message: 'No active services currently'
    }
  }
})
async getActiveServices() {
    return await this.serviceManagementService.getServicesByStatus(1); // 1 = active
  }


@Get(':id')
@ApiOperation({ summary: 'Get a single service by ID' })
@ApiParam({ name: 'id', description: 'The ID of the service to retrieve' })
@ApiResponse({
  status: 200,
  description: 'Service found',
  schema: {
    example: {
      id: 'cm9rxm70c0001reesizie46h3',
      name: 'My Service',
      category_id: 'clu1e9x0e0001tx08bd8y91gc',
      description: 'Full service description...',
      features: ['feat1', 'feat3', 'feat4'],
      tiers: [
        { max_post: 10, price: 99 },
        { max_post: 20, price: 149 }
      ],
      primary_platform: 'Instagram',
      extra_platforms: ['LinkedIn'],
      extra_platformPrice: 10,
      status: 1,
      created_at: '2025-04-26T10:00:00.000Z',
      updated_at: '2025-04-26T10:00:00.000Z',
    }
  }
})
@ApiResponse({
  status: 404,
  description: 'Service not found',
  schema: {
    example: {
      success: false,
      message: {
        message: 'Service with ID cm9rxm70c0001reesizie46h3 not found',
        error: 'Not Found',
        statusCode: 404
      }
    }
  }
})
async getServiceById(@Param('id') id: string) {
    return await this.serviceManagementService.getServiceById(id);
  }

@Put(':id')
@ApiOperation({ summary: 'Update a service by ID' })
@ApiParam({ name: 'id', description: 'The ID of the service to update' })
@ApiResponse({
  status: 200,
  description: 'Service updated successfully',
  schema: {
    example: {
      success: true,
      message: 'Service updated successfully',
      data: {
        id: 'cm9wdxupu0001re44d5777p20',
        name: 'Updated Service',
        description: 'New description',
        category_id: 'clu1e9x0e0001tx08bd8y91gc',
        features: ['feat1', 'feat3'],
        tiers: [
          { max_post: 10, price: 99 },
          { max_post: 20, price: 149 }
        ],
        primary_platform: 'Instagram',
        extra_platforms: ['LinkedIn'],
        extra_platformPrice: 15,
        status: 1,
        updated_at: '2025-04-26T12:00:00.000Z'
      }
    }
  }
})
@ApiResponse({
  status: 404,
  description: 'Service not found',
  schema: {
    example: {
      success: false,
      message: {
        message: 'Service with ID cm9wdxupu0001re44d5777p20 not found',
        error: 'Not Found',
        statusCode: 404
      }
    }
  }
})
async updateServices(@Param('id') id: string, @Body() dto: CreateServiceDto) {
    return await this.serviceManagementService.updateServices(id, dto);
  }

@Delete(':id')
@ApiOperation({ summary: 'Soft delete a service by ID' })
@ApiParam({ name: 'id', description: 'The ID of the service to soft delete' })
@ApiResponse({
  status: 200,
  description: 'Service soft-deleted successfully',
  schema: {
    example: {
      success: true,
      message: 'Service deleted successfully',
      data: {
        id: 'cm9wdxupu0001re44d5777p20'
      }
    }
  }
})
@ApiResponse({
  status: 404,
  description: 'Service not found',
  schema: {
    example: {
      success: false,
      message: {
        message: 'Service with ID cm9wdxupu0001re44d5777p20 not found',
        error: 'Not Found',
        statusCode: 404
      }
    }
  }
})
async softDeleteService(@Param('id') id: string) {
    return await this.serviceManagementService.softDeleteService(id);
  }
}
