import { Controller, Get, Post, Body, Patch, Param, Delete, Req, BadRequestException, Query } from '@nestjs/common';
import { EmailService } from './email.service';
import { CreateEmailDto } from './dto/create-email.dto';
import { UpdateEmailDto } from './dto/update-email.dto';
import { CreateEmailForAll } from './dto/create-email-for-all.dto';
@Controller('admin/email')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

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

  //working here ----->>>>>4-6-2025
 @Get('inbox')
  async getGmailInbox(
    @Query('email') email: string,
    @Query('password') password: string
  ) {
    if (!email || !password) {
      throw new BadRequestException('Email and password (app password) are required!');
    }
    // For demo/testing only! In production, use OAuth, not direct passwords.
    const inbox = await this.emailService.getInboxMails(email, password);
    return {
      success: true,
      message: 'Fetched Gmail inbox!',
      data: inbox
    };
  }


  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.emailService.findOne(id);
  }

}
