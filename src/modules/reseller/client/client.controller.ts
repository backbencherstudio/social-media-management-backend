import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
} from '@nestjs/common';
import { ClientService } from './client.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';

@Controller('client')
export class ClientController {
  constructor(private readonly clientService: ClientService) {}

  @Post()
  create(@Body() createClientDto: CreateClientDto) {
    return this.clientService.create(createClientDto);
  }

  @Get()
  async findAll(@Req() req) {
    const resellerId = "RES_n461l81lt1q8naigks2170vm"  //todo:  replace req.user.userId;
    return this.clientService.findAll(resellerId);
  }

  @Get(':userId')
  async findOne(@Param('userId') userId: string, @Req() req) {
    const resellerId = "RES_n461l81lt1q8naigks2170vm"  //todo:  replace req.user.userId;
    return this.clientService.findOne(resellerId, userId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateClientDto: UpdateClientDto) {
    return this.clientService.update(+id, updateClientDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.clientService.remove(+id);
  }
}
