import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { TeamService } from './team.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from 'src/common/guard/role/role.enum';
import { Roles } from 'src/common/guard/role/roles.decorator';
import { RolesGuard } from 'src/common/guard/role/roles.guard';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';



@ApiBearerAuth()
@ApiTags('Website Info')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN_LITE)
@Controller('team')
export class TeamController {
  constructor(private readonly teamService: TeamService) {}

  @Post('add')
  addMember(@Body() dto: CreateTeamDto) {
    return this.teamService.addMember(dto);
  }

  @Patch('edit/:id')
  updateMember(@Param('id') id: string, @Body() dto: UpdateTeamDto) {
    return this.teamService.updateMember(id, dto);
  }

  @Delete(':id')
  deleteMember(@Param('id') id: string) {
    return this.teamService.deleteMember(id);
  }

  @Get('getall')
  getMembers() {
    return this.teamService.getAllMembers();
  }


}
