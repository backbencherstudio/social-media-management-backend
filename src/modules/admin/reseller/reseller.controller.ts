import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ResellerService } from './reseller.service';
import { CreateResellerDto } from './dto/create-reseller.dto';
import { UpdateResellerDto } from './dto/update-reseller.dto';
import { ApiResponse } from '@nestjs/swagger';

@Controller('reseller')
export class ResellerController {
  constructor(private readonly resellerService: ResellerService) {}

  @Post()
  create(@Body() createResellerDto: CreateResellerDto) {
    return this.resellerService.create(createResellerDto);
  }

  @ApiResponse({ description: 'Get all users' })
  @Get()
  async findAllResellers(
    @Query() query: { q?: string; type?: string; approved?: string },
  ) {
    try {
      const q = query.q;
      const type = query.type;
      const approved = query.approved;

      const users = await this.resellerService.findAllResellers({
        q,
        type,
        approved,
      });
      return users;
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.resellerService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateResellerDto: UpdateResellerDto) {
    return this.resellerService.update(+id, updateResellerDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.resellerService.remove(+id);
  }
}
