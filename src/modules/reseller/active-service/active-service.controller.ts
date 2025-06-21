import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ActiveServiceService } from './active-service.service';
import { CreateActiveServiceDto } from './dto/create-active-service.dto';
import { UpdateActiveServiceDto } from './dto/update-active-service.dto';

@Controller('active-service')
export class ActiveServiceController {
  constructor(private readonly activeServiceService: ActiveServiceService) {}

  @Post()
  create(@Body() createActiveServiceDto: CreateActiveServiceDto) {
    return this.activeServiceService.create(createActiveServiceDto);
  }

  @Get()
  async findAll() {
    return this.activeServiceService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.activeServiceService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateActiveServiceDto: UpdateActiveServiceDto) {
    return this.activeServiceService.update(+id, updateActiveServiceDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.activeServiceService.remove(+id);
  }
}
