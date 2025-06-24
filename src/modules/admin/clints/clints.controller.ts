import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ClintsService } from './clints.service';
import { CreateClintDto } from './dto/create-clint.dto';
import { UpdateClintDto } from './dto/update-clint.dto';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Role } from 'src/common/guard/role/role.enum';
import { Roles } from 'src/common/guard/role/roles.decorator';
import { RolesGuard } from 'src/common/guard/role/roles.guard';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';


@ApiBearerAuth()
@ApiTags('Website Info')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN_LITE)
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
