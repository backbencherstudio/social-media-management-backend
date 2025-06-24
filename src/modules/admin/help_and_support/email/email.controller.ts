import { Controller, Get, Post, Body, Patch, Param, Delete, Req, BadRequestException, Query, UseGuards } from '@nestjs/common';
import { EmailService } from './email.service';
import { CreateEmailDto } from './dto/create-email.dto';
import { UpdateEmailDto } from './dto/update-email.dto';
import { CreateEmailForAll } from './dto/create-email-for-all.dto';
import { ConfigService } from '@nestjs/config';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from 'src/common/guard/role/role.enum';
import { Roles } from 'src/common/guard/role/roles.decorator';
import { RolesGuard } from 'src/common/guard/role/roles.guard';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';


@ApiBearerAuth()
@ApiTags('Website Info')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN_LITE)
@Controller('admin/email')
export class EmailController {
  constructor(private readonly emailService: EmailService,   private readonly configService: ConfigService) {}

  @Post('create_email')
  createOne(@Body() createEmailDto: CreateEmailDto) {
    return this.emailService.createEmail(createEmailDto);
  }

  
  @Post('create_email_for_all')
  createForAll(@Body() CreateEmailForAll: CreateEmailForAll) {
    return this.emailService.createEmailForAllUsers(CreateEmailForAll);
  }

  @Get('all')
  findAll() {
    return this.emailService.findAll();
  }

 @Get('inbox')
  async getGmailInbox() {
    const inbox = await this.emailService.getInboxMails();
    return {
      success: true,
      message: 'Fetched Gmail inbox!',
      data: inbox,
    };
  }


  @Get('sent/:id')
  findOne(@Param('id') id: string) {
    return this.emailService.findOne(id);
  }

@Get('inbox/:uid')
async getOne(@Param('uid') uid: string) {
  return this.emailService.getOneMail(Number(uid));
}



}
