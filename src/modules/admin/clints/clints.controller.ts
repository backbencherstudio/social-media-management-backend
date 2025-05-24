import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ClintsService } from './clints.service';
import { CreateClintDto } from './dto/create-clint.dto';
import { UpdateClintDto } from './dto/update-clint.dto';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

@Controller('clints')
export class ClintsController {
  constructor(private readonly clintsService: ClintsService) {}


  @Get()
  findAll() {
    return this.clintsService.getAllClints();
  }

  @Patch('toggle-status/:id')
@ApiOperation({ summary: 'Toggle order status (active/inactive)' })
@ApiResponse({
  status: 200,
  description: 'Successfully toggled status',
})
toggleOrderStatus(@Param('id') id: string) {
  return this.clintsService.toggleOrderStatus(id);
}


}
