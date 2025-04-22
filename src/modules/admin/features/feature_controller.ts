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

@Controller('features')
export class FeatureController {
  constructor(private readonly featureService: FeatureServices) {}

  // ✅ Create a new feature
  @Post()
  async create(@Body() createFeatureDto: CreateFeatureDto) {
    return await this.featureService.create(createFeatureDto);
  }

  // ✅ Get all features
  @Get()
  async findAll() {
    return await this.featureService.findAll();
  }

  // ✅ Get a single feature by ID
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.featureService.findOne(id);
  }

  // ✅ Update a feature by ID
  @Put(':id')
  async update(@Param('id') id: string, @Body() updateFeatureDto: UpdateFeatureDto) {
    return await this.featureService.update(id, updateFeatureDto);
  }

  // ✅ Delete a feature by ID
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return await this.featureService.remove(id);
  }
}
