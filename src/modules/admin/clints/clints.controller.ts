import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ClintsService } from './clints.service';
import { CreateClintDto } from './dto/create-clint.dto';
import { UpdateClintDto } from './dto/update-clint.dto';

@Controller('clints')
export class ClintsController {
  constructor(private readonly clintsService: ClintsService) {}

  @Post()
  create(@Body() createClintDto: CreateClintDto) {
    return this.clintsService.create(createClintDto);
  }

  @Get()
  findAll() {
    return this.clintsService.getAllClints();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.clintsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateClintDto: UpdateClintDto) {
    return this.clintsService.update(+id, updateClintDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.clintsService.remove(+id);
  }
}
