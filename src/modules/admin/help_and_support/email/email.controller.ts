import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
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

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.emailService.findOne(id);
  }

}
