import { Injectable } from '@nestjs/common';
import { CreateActiveServiceDto } from './dto/create-active-service.dto';
import { UpdateActiveServiceDto } from './dto/update-active-service.dto';

@Injectable()
export class ActiveServiceService {
  create(createActiveServiceDto: CreateActiveServiceDto) {
    return 'This action adds a new activeService';
  }

  findAll() {
    return `This action returns all activeService`;
  }

  findOne(id: number) {
    return `This action returns a #${id} activeService`;
  }

  update(id: number, updateActiveServiceDto: UpdateActiveServiceDto) {
    return `This action updates a #${id} activeService`;
  }

  remove(id: number) {
    return `This action removes a #${id} activeService`;
  }
}
