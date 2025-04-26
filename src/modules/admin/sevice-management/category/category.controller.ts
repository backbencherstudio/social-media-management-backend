import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
} from '@nestjs/common';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category';
import { ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';

@Controller('categories')
export class CategoryController {
constructor(private readonly svc: CategoryService) {}

@Post()
@ApiOperation({ summary: 'Create a new category' })
@ApiResponse({
  status: 201,
  description: 'Category created successfully',
  schema: {
    example: {
      id: 'cm9xpuedf0000reugxplxmpus',
      created_at: '2025-04-26T04:24:03.369Z',
      updated_at: '2025-04-26T04:24:03.369Z',
      deleted_at: null,
      status: 1,
      name: 'new media',
      slug: 'new-media',
    },
  },
})
create(@Body() dto: CreateCategoryDto) {
  return this.svc.create(dto);
}

@Get()
@ApiOperation({ summary: 'Get all categories' })
@ApiResponse({
status: 200,
description: 'List of all categories',
schema: {
  example: [
    {
      id: 'cm9xpuedf0000reugxplxmpus',
      created_at: '2025-04-26T04:24:03.369Z',
      updated_at: '2025-04-26T04:24:03.369Z',
      deleted_at: null,
      status: 1,
      name: 'new media',
      slug: 'new-media',
    },
    {
      id: 'cm9xq2zdp0002reugxuyvkyx3',
      created_at: '2025-04-26T05:00:00.000Z',
      updated_at: '2025-04-26T05:00:00.000Z',
      deleted_at: null,
      status: 1,
      name: 'technology',
      slug: 'tech',
    },
  ],
},
})
findAll() {
  return this.svc.findAll();
}

@Get(':id')
@ApiOperation({ summary: 'Get a single category by ID' })
@ApiParam({ name: 'id', description: 'The ID of the category' })
@ApiResponse({
status: 200,
description: 'Category fetched successfully',
schema: {
  example: {
    id: 'cm9xpuedf0000reugxplxmpus',
    created_at: '2025-04-26T04:24:03.369Z',
    updated_at: '2025-04-26T04:24:03.369Z',
    deleted_at: null,
    status: 1,
    name: 'new media',
    slug: 'new-media',
  },
},
})
@ApiResponse({
status: 404,
description: 'Category not found',
schema: {
  example: {
    success: false,
    message: {
      message: 'Category with ID cm9xpuedf0000reugxplxmpus not found',
      error: 'Not Found',
      statusCode: 404,
    },
  },
},
})
findOne(@Param('id') id: string) {
  return this.svc.findOne(id);
}

@Delete(':id')
@ApiOperation({ summary: 'Soft delete a category by ID' })
@ApiParam({ name: 'id', description: 'The ID of the category to delete' })
@ApiResponse({
status: 200,
description: 'Category soft-deleted successfully',
schema: {
  example: {
    message: 'Category deleted successfully',
    data: {
      id: 'cm9xpuedf0000reugxplxmpus',
    },
  },
},
})
@ApiResponse({
status: 404,
description: 'Category not found',
schema: {
  example: {
    success: false,
    message: {
      message: 'Category with ID cm9xpuedf0000reugxplxmpus not found',
      error: 'Not Found',
      statusCode: 404,
    },
  },
},
})
remove(@Param('id') id: string) {
  return this.svc.remove(id);
}
}
